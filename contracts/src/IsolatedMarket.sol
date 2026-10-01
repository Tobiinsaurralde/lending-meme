// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IQuote {
    /// @notice USDC (6 decimals) that `amount` of `token` is worth.
    function quote(address token, uint256 amount) external view returns (uint256);
}

interface IFlashBorrower {
    function onFlashLoan(uint256 amount, bytes calldata data) external;
}

interface IUsdc {
    function balanceOf(address) external view returns (uint256);
    function transfer(address, uint256) external returns (bool);
    function transferFrom(address, address, uint256) external returns (bool);
}

/// @title IsolatedMarket
/// @notice One collateral, one USDC pool. Suppliers earn the interest borrowers
///         pay. The borrow rate rises with utilization. A flash loan must be
///         repaid in the same transaction and charges no fee. Liquidation
///         hands the collateral to whoever repays the debt, with a bonus.
contract IsolatedMarket {
    uint256 private constant BPS = 10_000;
    uint256 private constant YEAR = 365 days;
    uint256 private constant VIRTUAL = 1e6;

    address public immutable usdc;
    address public immutable collateral;
    address public immutable oracle;
    address public immutable treasury;
    uint16 public immutable maxLtvBps;
    uint16 public immutable lltvBps;
    uint16 public immutable bonusBps;
    uint16 public immutable kinkBps;
    uint16 public immutable rateAtKinkBps;
    uint16 public immutable rateMaxBps;
    uint16 public immutable reserveBps;

    uint256 public supplyShares;
    uint256 public borrowAssets;
    uint256 public borrowShares;
    uint256 public reserve;
    uint40 public lastAccrual;

    mapping(address => uint256) public sharesOf;
    mapping(address => uint256) public borrowSharesOf;
    mapping(address => uint256) public collateralOf;

    uint256 private _locked;

    event Supplied(address indexed account, uint256 assets, uint256 shares);
    event Withdrawn(address indexed account, uint256 shares, uint256 assets);
    event Borrowed(address indexed account, uint256 collateralIn, uint256 assets);
    event Repaid(address indexed account, uint256 assets, uint256 collateralOut);
    event Liquidated(address indexed borrower, address indexed liquidator, uint256 repaid, uint256 seized);
    event ReserveTaken(address indexed treasury, uint256 amount);

    error BadInput();
    error NoLiquidity();
    error Healthy();
    error Insolvent();
    error NotEnough();
    error TransferFailed();
    error Reentered();

    modifier nonReentrant() {
        if (_locked == 1) revert Reentered();
        _locked = 1;
        _;
        _locked = 0;
    }

    constructor(
        address usdc_,
        address collateral_,
        address oracle_,
        address treasury_,
        uint16 maxLtvBps_,
        uint16 lltvBps_,
        uint16 bonusBps_,
        uint16 kinkBps_,
        uint16 rateAtKinkBps_,
        uint16 rateMaxBps_,
        uint16 reserveBps_
    ) {
        if (usdc_ == address(0) || collateral_ == address(0) || collateral_ == usdc_ || oracle_ == address(0)) {
            revert BadInput();
        }
        if (treasury_ == address(0) || treasury_ == address(this)) revert BadInput();
        if (maxLtvBps_ == 0 || maxLtvBps_ >= lltvBps_ || lltvBps_ > 9_000) revert BadInput();
        if (bonusBps_ == 0 || bonusBps_ > 2_000) revert BadInput();
        if (kinkBps_ == 0 || kinkBps_ >= BPS) revert BadInput();
        if (rateMaxBps_ < rateAtKinkBps_ || rateMaxBps_ > 10_000) revert BadInput();
        if (reserveBps_ > 5_000) revert BadInput();

        usdc = usdc_;
        collateral = collateral_;
        oracle = oracle_;
        treasury = treasury_;
        maxLtvBps = maxLtvBps_;
        lltvBps = lltvBps_;
        bonusBps = bonusBps_;
        kinkBps = kinkBps_;
        rateAtKinkBps = rateAtKinkBps_;
        rateMaxBps = rateMaxBps_;
        reserveBps = reserveBps_;
        lastAccrual = uint40(block.timestamp);
    }

    // ---------------------------------------------------------------- views

    function totalAssets() public view returns (uint256) {
        return IUsdc(usdc).balanceOf(address(this)) + borrowAssets - reserve;
    }

    function cash() public view returns (uint256) {
        return IUsdc(usdc).balanceOf(address(this));
    }

    /// @notice Borrow APR in bps at the current utilization, before accrual.
    function borrowRateBps() public view returns (uint256) {
        uint256 base = totalAssets();
        if (base == 0 || borrowAssets == 0) return 0;
        uint256 util = (borrowAssets * BPS) / base;
        if (util > BPS) util = BPS;
        if (util <= kinkBps) return (uint256(rateAtKinkBps) * util) / kinkBps;
        return uint256(rateAtKinkBps) + ((uint256(rateMaxBps) - rateAtKinkBps) * (util - kinkBps)) / (BPS - kinkBps);
    }

    function debtOf(address account) public view returns (uint256) {
        uint256 shares = borrowSharesOf[account];
        if (shares == 0 || borrowShares == 0) return 0;
        return (shares * borrowAssets) / borrowShares;
    }

    function previewRedeem(uint256 shares) public view returns (uint256) {
        return (shares * (totalAssets() + 1)) / (supplyShares + VIRTUAL);
    }

    // ---------------------------------------------------------------- suppliers

    function supply(uint256 assets) external nonReentrant returns (uint256 shares) {
        if (assets == 0) revert BadInput();
        _accrue();
        uint256 before = totalAssets();
        _pull(usdc, msg.sender, assets);
        shares = (assets * (supplyShares + VIRTUAL)) / (before + 1);
        if (shares == 0) revert BadInput();
        supplyShares += shares;
        sharesOf[msg.sender] += shares;
        emit Supplied(msg.sender, assets, shares);
    }

    function withdraw(uint256 shares) external nonReentrant returns (uint256 assets) {
        if (shares == 0 || shares > sharesOf[msg.sender]) revert BadInput();
        _accrue();
        assets = previewRedeem(shares);
        if (assets == 0 || assets > cash()) revert NoLiquidity();
        sharesOf[msg.sender] -= shares;
        supplyShares -= shares;
        _push(usdc, msg.sender, assets);
        emit Withdrawn(msg.sender, shares, assets);
    }

    // ---------------------------------------------------------------- borrowers

    /// @notice Lock collateral and receive USDC, up to `maxLtvBps` of its quoted value.
    function borrow(uint256 amount) external nonReentrant returns (uint256 assets) {
        if (amount == 0) revert BadInput();
        _accrue();
        uint256 held = IUsdc(collateral).balanceOf(address(this));
        _pull(collateral, msg.sender, amount);
        amount = IUsdc(collateral).balanceOf(address(this)) - held;

        uint256 value = IQuote(oracle).quote(collateral, amount);
        assets = (value * maxLtvBps) / BPS;
        uint256 available = cash();
        if (assets == 0 || available <= reserve || assets > available - reserve) revert NoLiquidity();

        uint256 debt = debtOf(msg.sender);
        uint256 nextCollateral = collateralOf[msg.sender] + amount;
        uint256 nextValue = IQuote(oracle).quote(collateral, nextCollateral);
        if ((debt + assets) * BPS > nextValue * maxLtvBps) revert Insolvent();

        _mintDebt(msg.sender, assets);
        collateralOf[msg.sender] = nextCollateral;
        _push(usdc, msg.sender, assets);
        emit Borrowed(msg.sender, amount, assets);
    }

    function repay(uint256 assets) external nonReentrant returns (uint256 collateralOut) {
        _accrue();
        uint256 debt = debtOf(msg.sender);
        if (debt == 0) revert BadInput();
        if (assets > debt) assets = debt;

        uint256 shares = borrowSharesOf[msg.sender];
        if (assets < debt) {
            shares = (assets * borrowShares) / borrowAssets;
            if (shares == 0) revert BadInput();
        }
        _burnDebt(msg.sender, shares, assets);
        _pull(usdc, msg.sender, assets);

        if (borrowSharesOf[msg.sender] == 0) {
            collateralOut = collateralOf[msg.sender];
            collateralOf[msg.sender] = 0;
            _push(collateral, msg.sender, collateralOut);
        }
        emit Repaid(msg.sender, assets, collateralOut);
    }

    /// @notice Repay `assets` of an unhealthy loan and receive collateral worth that
    ///         repayment plus `bonusBps`.
    function liquidate(address borrower, uint256 assets) external nonReentrant returns (uint256 seized) {
        if (borrower == address(0) || assets == 0) revert BadInput();
        _accrue();
        uint256 col = collateralOf[borrower];
        uint256 value = IQuote(oracle).quote(collateral, col);
        uint256 debt = debtOf(borrower);
        if (col == 0 || value == 0 || debt == 0) revert BadInput();
        if (debt * BPS <= value * lltvBps) revert Healthy();

        if (assets > debt) assets = debt;
        seized = (assets * (BPS + bonusBps) * col) / (BPS * value);
        if (seized > col) {
            seized = col;
            assets = (seized * value * BPS) / (col * (BPS + bonusBps));
            if (assets == 0) revert BadInput();
        }
        if (assets > debt) assets = debt;

        uint256 shares = assets == debt ? borrowSharesOf[borrower] : (assets * borrowShares) / borrowAssets;
        if (shares == 0) revert BadInput();
        _burnDebt(borrower, shares, assets);
        collateralOf[borrower] = col - seized;
        _pull(usdc, msg.sender, assets);
        _push(collateral, msg.sender, seized);
        emit Liquidated(borrower, msg.sender, assets, seized);
    }

    /// @notice Borrow USDC and repay it, plus nothing extra, before this call returns.
    function flash(uint256 amount, bytes calldata data) external {
        if (_locked == 1) revert Reentered();
        uint256 available = cash();
        if (amount == 0 || available <= reserve || amount > available - reserve) revert NoLiquidity();
        uint256 before = cash();
        _push(usdc, msg.sender, amount);
        IFlashBorrower(msg.sender).onFlashLoan(amount, data);
        if (cash() < before) revert NotEnough();
    }

    function accrue() external {
        _accrue();
    }

    function skim() external {
        _accrue();
        uint256 amount = reserve;
        if (amount == 0 || amount > cash()) return;
        reserve = 0;
        _push(usdc, treasury, amount);
        emit ReserveTaken(treasury, amount);
    }

    // ---------------------------------------------------------------- internals

    function _accrue() internal {
        uint256 dt = block.timestamp - lastAccrual;
        lastAccrual = uint40(block.timestamp);
        if (dt == 0 || borrowAssets == 0) return;
        uint256 interest = (borrowAssets * borrowRateBps() * dt) / (YEAR * BPS);
        if (interest == 0) return;
        uint256 fee = (interest * reserveBps) / BPS;
        borrowAssets += interest;
        reserve += fee;
    }

    function _mintDebt(address account, uint256 assets) internal {
        uint256 shares = borrowShares == 0 ? assets : (assets * borrowShares) / borrowAssets;
        if (shares == 0) revert BadInput();
        borrowAssets += assets;
        borrowShares += shares;
        borrowSharesOf[account] += shares;
    }

    function _burnDebt(address account, uint256 shares, uint256 assets) internal {
        if (shares > borrowSharesOf[account]) revert BadInput();
        borrowSharesOf[account] -= shares;
        borrowShares -= shares;
        borrowAssets -= assets;
    }

    function _pull(address token, address from, uint256 amount) internal {
        if (!IUsdc(token).transferFrom(from, address(this), amount)) revert TransferFailed();
    }

    function _push(address token, address to, uint256 amount) internal {
        if (!IUsdc(token).transfer(to, amount)) revert TransferFailed();
    }
}
