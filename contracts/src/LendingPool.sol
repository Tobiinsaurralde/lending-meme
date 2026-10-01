// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IUniswapV3PoolLike {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function slot0()
        external
        view
        returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, uint8, bool);
    function observe(uint32[] calldata secondsAgos)
        external
        view
        returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s);
    function increaseObservationCardinalityNext(uint16 observationCardinalityNext) external;
    function swap(address recipient, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96, bytes calldata data)
        external
        returns (int256 amount0, int256 amount1);
}

interface IUniswapV2PairLike {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function price0CumulativeLast() external view returns (uint256);
    function price1CumulativeLast() external view returns (uint256);
    function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external;
}

/// @title LendingPool
/// @notice Fixed-term USDC loans against a memecoin on Arc.
///         Three tiers, one flat fee taken up front. 80% of that fee stays with
///         suppliers and 20% goes to the treasury. Repay the principal and the
///         collateral comes back.
///
///         Each collateral is priced from its USDC market on chain: a Uniswap V3
///         pool (time-weighted tick) or a Uniswap V2-style pair (time-weighted
///         cumulative price). A loan is sized on the lower of that average and
///         the spot price.
///
///         Anyone can liquidate a loan that is past due, or whose collateral,
///         at the average price, is worth less than twice the debt. The pool
///         sells the collateral into that same market, the caller keeps 1% of
///         the proceeds and everything else stays with suppliers, surplus over
///         the debt included. The borrower keeps the USDC they borrowed and
///         nothing more. A shortfall is a loss to suppliers.
contract LendingPool {
    uint256 private constant BPS = 10_000;
    uint256 private constant PROTOCOL_FEE_BPS = 2_000;
    /// @dev Liquidatable once debt exceeds this share of the collateral's average value.
    uint256 public constant LIQUIDATION_LTV_BPS = 5_000;
    uint256 public constant KEEPER_REWARD_BPS = 100;
    uint256 private constant VIRTUAL_SHARES = 1e6;
    uint256 private constant Q128 = 1 << 128;
    uint256 private constant Q112 = 1 << 112;
    uint160 private constant MIN_SQRT_RATIO_PLUS_ONE = 4295128740;
    uint160 private constant MAX_SQRT_RATIO_MINUS_ONE = 1461446703485210103287273052203988822378723970341;
    /// @dev A V2 average older than this is stale and blocks new loans.
    uint32 public constant MAX_ORACLE_AGE = 3 days;

    uint8 public constant VENUE_V3 = 1;
    uint8 public constant VENUE_V2 = 2;

    struct Tier {
        uint16 ltvBps;
        uint16 feeBps;
        uint32 duration;
    }

    struct Asset {
        bool enabled;
        uint8 decimals;
        uint8 venue;
        bool tokenIsToken0;
        uint16 swapFeeBps;
        uint16 maxSlippageBps;
        uint32 twapWindow;
        address market;
    }

    struct Checkpoint {
        uint256 cumulative;
        uint32 timestamp;
    }

    struct Loan {
        address borrower;
        address collateral;
        uint256 collateralAmount;
        uint256 principal;
        uint64 due;
        bool open;
    }

    address public owner;
    address public treasury;
    address public immutable usdc;

    Tier[3] public tiers;
    mapping(address => Asset) public assets;
    /// @dev [older, newer] snapshots of a V2 pair's cumulative price.
    mapping(address => Checkpoint[2]) private _checkpoints;

    Loan[] public loans;
    mapping(address => uint256[]) private _loansOf;
    uint256[] private _open;
    mapping(uint256 => uint256) private _openIndex;

    uint256 public totalShares;
    uint256 public borrowed;
    mapping(address => uint256) public sharesOf;

    uint256 private _locked;
    address private _swapMarket;

    event Supplied(address indexed supplier, uint256 amount, uint256 shares);
    event Withdrawn(address indexed supplier, uint256 shares, uint256 amount);
    event Borrowed(
        uint256 indexed loanId,
        address indexed borrower,
        address indexed collateral,
        uint256 collateralAmount,
        uint256 principal,
        uint256 received,
        uint64 due
    );
    event Repaid(uint256 indexed loanId, address indexed borrower);
    event Closed(uint256 indexed loanId, address indexed closer);
    event Liquidated(
        uint256 indexed loanId,
        address indexed keeper,
        uint256 proceeds,
        uint256 reward,
        uint256 shortfall
    );
    event CollateralSet(address indexed token, address market, uint8 venue, bool enabled);

    error NotOwner();
    error BadInput();
    error NotEnabled();
    error NoLiquidity();
    error NotBorrower();
    error NotOpen();
    error NotDue();
    error Healthy();
    error OracleUnavailable();
    error Slippage();
    error TransferFailed();
    error Reentered();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier nonReentrant() {
        if (_locked == 1) revert Reentered();
        _locked = 1;
        _;
        _locked = 0;
    }

    constructor(address usdc_, address treasury_) {
        if (usdc_ == address(0) || treasury_ == address(0) || treasury_ == address(this)) revert BadInput();
        owner = msg.sender;
        treasury = treasury_;
        usdc = usdc_;
        // Express 30% / 2 days / 3%, Quick 25% / 3 days / 2%, Standard 20% / 7 days / 1.5%.
        tiers[0] = Tier(3_000, 300, 2 days);
        tiers[1] = Tier(2_500, 200, 3 days);
        tiers[2] = Tier(2_000, 150, 7 days);
    }

    // ---------------------------------------------------------------- owner

    function setTreasury(address next) external onlyOwner {
        if (next == address(0) || next == address(this)) revert BadInput();
        treasury = next;
    }

    function transferOwnership(address next) external onlyOwner {
        if (next == address(0)) revert BadInput();
        owner = next;
    }

    /// @param market Uniswap V3 pool or V2-style pair of `token` against USDC.
    /// @param venue VENUE_V3 or VENUE_V2.
    /// @param swapFeeBps V2 pair swap fee. Ignored for V3.
    /// @param maxSlippageBps Liquidation fails if the sale returns less than the
    ///        average value minus this share.
    /// @param twapWindow Seconds averaged by the oracle.
    /// @param cardinality V3 observation slots to reserve. Zero leaves the pool as it is.
    function setCollateral(
        address token,
        address market,
        uint8 venue,
        uint16 swapFeeBps,
        uint16 maxSlippageBps,
        uint32 twapWindow,
        uint16 cardinality,
        bool enabled
    ) external onlyOwner {
        if (token == address(0) || token == usdc || market == address(0)) revert BadInput();
        if (venue != VENUE_V3 && venue != VENUE_V2) revert BadInput();
        if (swapFeeBps >= 1_000 || maxSlippageBps == 0 || maxSlippageBps > 5_000) revert BadInput();
        if (twapWindow < 5 minutes || twapWindow > 6 hours) revert BadInput();

        address t0 = IUniswapV2PairLike(market).token0();
        address t1 = IUniswapV2PairLike(market).token1();
        bool tokenIsToken0 = t0 == token;
        if (!(tokenIsToken0 && t1 == usdc) && !(t1 == token && t0 == usdc)) revert BadInput();
        bool newMarket = assets[token].market != market;

        assets[token] = Asset(
            enabled,
            _decimals(token),
            venue,
            tokenIsToken0,
            swapFeeBps,
            maxSlippageBps,
            twapWindow,
            market
        );

        if (venue == VENUE_V3 && cardinality > 0) {
            IUniswapV3PoolLike(market).increaseObservationCardinalityNext(cardinality);
        }
        if (venue == VENUE_V2 && newMarket) {
            Checkpoint memory now_ = Checkpoint(_v2Cumulative(market, tokenIsToken0), uint32(block.timestamp));
            _checkpoints[token][0] = now_;
            _checkpoints[token][1] = now_;
        }
        emit CollateralSet(token, market, venue, enabled);
    }

    // ---------------------------------------------------------------- views

    /// @notice USDC owed to suppliers: cash still in the pool plus principal outstanding.
    function totalAssets() public view returns (uint256) {
        return _balance(usdc) + borrowed;
    }

    function loanCount() external view returns (uint256) {
        return loans.length;
    }

    function loansOf(address account) external view returns (uint256[] memory) {
        return _loansOf[account];
    }

    function openLoanIds() external view returns (uint256[] memory) {
        return _open;
    }

    /// @notice When the V2 price snapshot last moved. Zero for a V3 market.
    function lastPoke(address token) external view returns (uint32) {
        return _checkpoints[token][1].timestamp;
    }

    /// @notice USDC that `shares` would withdraw now, ignoring liquidity.
    function previewRedeem(uint256 shares) public view returns (uint256) {
        return (shares * (totalAssets() + 1)) / (totalShares + VIRTUAL_SHARES);
    }

    /// @notice USDC value of one whole token: time-weighted average and spot.
    function priceOf(address token) external view returns (uint256 average, uint256 spot) {
        Asset memory asset = assets[token];
        if (asset.venue == 0) revert NotEnabled();
        uint256 one = 10 ** asset.decimals;
        average = _averageValue(token, asset, one);
        spot = _spotValue(asset, one);
    }

    /// @notice Quote a borrow at the lower of the average and spot price. Does not move funds.
    function previewBorrow(address token, uint256 amount, uint8 tierId)
        external
        view
        returns (uint256 value, uint256 principal, uint256 fee, uint256 received, uint64 due)
    {
        (value, principal, fee, received, due) = _terms(token, amount, tierId);
    }

    /// @notice Where a loan stands. `value` is the collateral at the average price,
    ///         zero if the oracle cannot answer.
    function health(uint256 loanId)
        public
        view
        returns (uint256 value, uint256 debt, bool pastDue, bool underwater, bool liquidatable)
    {
        Loan memory loan = loans[loanId];
        if (!loan.open) return (0, loan.principal, false, false, false);
        debt = loan.principal;
        pastDue = block.timestamp >= loan.due;
        try this.averageValue(loan.collateral, loan.collateralAmount) returns (uint256 v) {
            value = v;
            underwater = debt * BPS > value * LIQUIDATION_LTV_BPS;
        } catch {}
        // liquidate() needs the average as a floor for the sale.
        liquidatable = (pastDue || underwater) && value > 0;
    }

    /// @dev External so `health` can survive an oracle that reverts.
    function averageValue(address token, uint256 amount) external view returns (uint256) {
        return _averageValue(token, assets[token], amount);
    }

    // ---------------------------------------------------------------- suppliers

    function supply(uint256 amount) external nonReentrant {
        if (amount == 0) revert BadInput();
        uint256 assetsBefore = totalAssets();
        _pull(usdc, msg.sender, amount);
        uint256 minted = (amount * (totalShares + VIRTUAL_SHARES)) / (assetsBefore + 1);
        if (minted == 0) revert BadInput();
        totalShares += minted;
        sharesOf[msg.sender] += minted;
        emit Supplied(msg.sender, amount, minted);
    }

    function withdraw(uint256 shareAmount) external nonReentrant {
        if (shareAmount == 0 || shareAmount > sharesOf[msg.sender]) revert BadInput();
        uint256 out = previewRedeem(shareAmount);
        if (out > _balance(usdc)) revert NoLiquidity();
        sharesOf[msg.sender] -= shareAmount;
        totalShares -= shareAmount;
        _push(usdc, msg.sender, out);
        emit Withdrawn(msg.sender, shareAmount, out);
    }

    // ---------------------------------------------------------------- borrowers

    /// @dev The loan is sized on the collateral that actually arrived, so a token
    ///      that takes a cut on transfer cannot borrow against tokens it never sent.
    function borrow(address token, uint256 amount, uint8 tierId) external nonReentrant returns (uint256 loanId) {
        if (amount == 0 || tierId > 2) revert BadInput();
        poke(token);
        uint256 held = _balance(token);
        _pull(token, msg.sender, amount);
        amount = _balance(token) - held;

        (uint256 value, uint256 principal, uint256 fee, uint256 received, uint64 due) = _terms(token, amount, tierId);
        if (value == 0 || received == 0) revert BadInput();
        uint256 protocolCut = (fee * PROTOCOL_FEE_BPS) / BPS;
        if (_balance(usdc) < received + protocolCut) revert NoLiquidity();

        borrowed += principal;
        _push(usdc, msg.sender, received);
        if (protocolCut > 0) _push(usdc, treasury, protocolCut);

        loanId = loans.length;
        loans.push(Loan(msg.sender, token, amount, principal, due, true));
        _loansOf[msg.sender].push(loanId);
        _openIndex[loanId] = _open.length;
        _open.push(loanId);
        emit Borrowed(loanId, msg.sender, token, amount, principal, received, due);
    }

    function repay(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        if (!loan.open) revert NotOpen();
        if (msg.sender != loan.borrower) revert NotBorrower();
        _settle(loanId, loan);
        _pull(usdc, msg.sender, loan.principal);
        _push(loan.collateral, loan.borrower, loan.collateralAmount);
        emit Repaid(loanId, loan.borrower);
    }

    /// @notice After the due date, pay the principal and take the collateral.
    ///         A manual way out when the market is too thin to liquidate.
    function close(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        if (!loan.open) revert NotOpen();
        if (block.timestamp < loan.due) revert NotDue();
        _settle(loanId, loan);
        _pull(usdc, msg.sender, loan.principal);
        _push(loan.collateral, msg.sender, loan.collateralAmount);
        emit Closed(loanId, msg.sender);
    }

    // ---------------------------------------------------------------- liquidation

    /// @notice Sell the collateral of a past-due or underwater loan. Anyone can call.
    function liquidate(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        if (!loan.open) revert NotOpen();
        address token = loan.collateral;
        poke(token);
        Asset memory asset = assets[token];
        if (asset.venue == 0) revert NotEnabled();

        bool pastDue = block.timestamp >= loan.due;
        uint256 average;
        bool priced;
        try this.averageValue(token, loan.collateralAmount) returns (uint256 v) {
            average = v;
            priced = true;
        } catch {}
        if (!pastDue && !(priced && loan.principal * BPS > average * LIQUIDATION_LTV_BPS)) revert Healthy();
        // Without an average there is no floor to protect the sale, so only a past-due loan may proceed.
        if (!priced) revert OracleUnavailable();

        uint256 debt = loan.principal;
        _settle(loanId, loan);

        uint256 proceeds = _sell(token, asset, loan.collateralAmount);
        if (proceeds * BPS < average * (BPS - asset.maxSlippageBps)) revert Slippage();

        uint256 reward = (proceeds * KEEPER_REWARD_BPS) / BPS;
        uint256 left = proceeds - reward;
        uint256 shortfall = left < debt ? debt - left : 0;

        if (reward > 0) _push(usdc, msg.sender, reward);
        emit Liquidated(loanId, msg.sender, proceeds, reward, shortfall);
    }

    /// @notice Roll a V2 pair's price snapshot forward. Called by borrow and
    ///         liquidate, and by the keeper so the average stays recent.
    function poke(address token) public {
        Asset memory asset = assets[token];
        if (asset.venue != VENUE_V2) return;
        Checkpoint[2] storage cp = _checkpoints[token];
        if (block.timestamp - cp[1].timestamp < asset.twapWindow) return;
        cp[0] = cp[1];
        cp[1] = Checkpoint(_v2Cumulative(asset.market, asset.tokenIsToken0), uint32(block.timestamp));
    }

    function uniswapV3SwapCallback(int256 amount0Delta, int256 amount1Delta, bytes calldata data) external {
        if (msg.sender != _swapMarket || _swapMarket == address(0)) revert BadInput();
        address token = abi.decode(data, (address));
        int256 owed = amount0Delta > 0 ? amount0Delta : amount1Delta;
        if (owed > 0) _push(token, msg.sender, uint256(owed));
    }

    // ---------------------------------------------------------------- internals

    function _settle(uint256 loanId, Loan storage loan) internal {
        loan.open = false;
        borrowed -= loan.principal;
        uint256 index = _openIndex[loanId];
        uint256 last = _open[_open.length - 1];
        _open[index] = last;
        _openIndex[last] = index;
        _open.pop();
        delete _openIndex[loanId];
    }

    function _terms(address token, uint256 amount, uint8 tierId)
        internal
        view
        returns (uint256 value, uint256 principal, uint256 fee, uint256 received, uint64 due)
    {
        if (tierId > 2 || amount == 0) revert BadInput();
        Asset memory asset = assets[token];
        if (!asset.enabled) revert NotEnabled();
        uint256 average = _averageValue(token, asset, amount);
        uint256 spot = _spotValue(asset, amount);
        value = average < spot ? average : spot;
        Tier memory tier = tiers[tierId];
        principal = (value * tier.ltvBps) / BPS;
        fee = (principal * tier.feeBps) / BPS;
        received = principal - fee;
        due = uint64(block.timestamp + tier.duration);
    }

    function _averageValue(address token, Asset memory asset, uint256 amount) internal view returns (uint256) {
        if (asset.venue == VENUE_V3) {
            uint32[] memory ago = new uint32[](2);
            ago[0] = asset.twapWindow;
            (int56[] memory cumulatives,) = IUniswapV3PoolLike(asset.market).observe(ago);
            int56 delta = cumulatives[1] - cumulatives[0];
            int56 window = int56(uint56(asset.twapWindow));
            int24 tick = int24(delta / window);
            if (delta < 0 && delta % window != 0) tick--;
            return _valueAtTick(asset, tick, amount);
        }
        if (asset.venue == VENUE_V2) {
            Checkpoint[2] storage cp = _checkpoints[token];
            Checkpoint memory base = block.timestamp - cp[1].timestamp >= asset.twapWindow ? cp[1] : cp[0];
            uint256 elapsed = block.timestamp - base.timestamp;
            if (elapsed < asset.twapWindow || elapsed > MAX_ORACLE_AGE) revert OracleUnavailable();
            uint256 priceX112;
            unchecked {
                priceX112 = (_v2Cumulative(asset.market, asset.tokenIsToken0) - base.cumulative) / elapsed;
            }
            return _mulDiv(amount, priceX112, Q112);
        }
        revert NotEnabled();
    }

    function _spotValue(Asset memory asset, uint256 amount) internal view returns (uint256) {
        if (asset.venue == VENUE_V3) {
            (, int24 tick,,,,,) = IUniswapV3PoolLike(asset.market).slot0();
            return _valueAtTick(asset, tick, amount);
        }
        (uint112 r0, uint112 r1,) = IUniswapV2PairLike(asset.market).getReserves();
        (uint256 rToken, uint256 rUsdc) = asset.tokenIsToken0 ? (uint256(r0), uint256(r1)) : (uint256(r1), uint256(r0));
        if (rToken == 0) revert OracleUnavailable();
        return _mulDiv(amount, rUsdc, rToken);
    }

    /// @dev A V3 tick prices token0 in token1 as 1.0001^tick, in raw units.
    function _valueAtTick(Asset memory asset, int24 tick, uint256 amount) internal pure returns (uint256) {
        int256 exponent = asset.tokenIsToken0 ? int256(tick) : -int256(tick);
        if (exponent >= 0) return _mulDiv(amount, _pow10001(uint256(exponent)), Q128);
        return _mulDiv(amount, Q128, _pow10001(uint256(-exponent)));
    }

    /// @dev 1.0001^n as a Q128 number, by squaring. Memecoin ticks stay far below the cap.
    function _pow10001(uint256 n) internal pure returns (uint256 result) {
        if (n > 600_000) revert OracleUnavailable();
        result = Q128;
        uint256 base = Q128 + Q128 / 10_000;
        while (n > 0) {
            if (n & 1 == 1) result = _mulDiv(result, base, Q128);
            n >>= 1;
            if (n > 0) base = _mulDiv(base, base, Q128);
        }
    }

    function _v2Cumulative(address pair, bool tokenIsToken0) internal view returns (uint256 cumulative) {
        IUniswapV2PairLike p = IUniswapV2PairLike(pair);
        (uint112 r0, uint112 r1, uint32 last) = p.getReserves();
        cumulative = tokenIsToken0 ? p.price0CumulativeLast() : p.price1CumulativeLast();
        uint32 nowTs = uint32(block.timestamp);
        if (last != nowTs && r0 != 0 && r1 != 0) {
            unchecked {
                uint32 elapsed = nowTs - last;
                uint256 priceX112 = tokenIsToken0 ? (uint256(r1) << 112) / r0 : (uint256(r0) << 112) / r1;
                cumulative += priceX112 * elapsed;
            }
        }
    }

    function _sell(address token, Asset memory asset, uint256 amount) internal returns (uint256 proceeds) {
        uint256 before = _balance(usdc);
        if (asset.venue == VENUE_V3) {
            bool zeroForOne = asset.tokenIsToken0;
            _swapMarket = asset.market;
            IUniswapV3PoolLike(asset.market).swap(
                address(this),
                zeroForOne,
                int256(amount),
                zeroForOne ? MIN_SQRT_RATIO_PLUS_ONE : MAX_SQRT_RATIO_MINUS_ONE,
                abi.encode(token)
            );
            _swapMarket = address(0);
        } else {
            IUniswapV2PairLike pair = IUniswapV2PairLike(asset.market);
            (uint112 r0, uint112 r1,) = pair.getReserves();
            (uint256 rIn, uint256 rOut) = asset.tokenIsToken0 ? (uint256(r0), uint256(r1)) : (uint256(r1), uint256(r0));
            _push(token, address(pair), amount);
            uint256 amountIn = _balanceOf(token, address(pair)) - rIn;
            uint256 inAfterFee = amountIn * (BPS - asset.swapFeeBps);
            uint256 out = (inAfterFee * rOut) / (rIn * BPS + inAfterFee);
            (uint256 out0, uint256 out1) = asset.tokenIsToken0 ? (uint256(0), out) : (out, uint256(0));
            pair.swap(out0, out1, address(this), new bytes(0));
        }
        proceeds = _balance(usdc) - before;
    }

    function _decimals(address token) internal view returns (uint8) {
        (bool ok, bytes memory data) = token.staticcall(abi.encodeWithSignature("decimals()"));
        if (!ok || data.length < 32) revert BadInput();
        return abi.decode(data, (uint8));
    }

    function _balance(address token) internal view returns (uint256) {
        return _balanceOf(token, address(this));
    }

    function _balanceOf(address token, address account) internal view returns (uint256) {
        (bool ok, bytes memory data) = token.staticcall(abi.encodeWithSignature("balanceOf(address)", account));
        if (!ok || data.length < 32) revert TransferFailed();
        return abi.decode(data, (uint256));
    }

    function _pull(address token, address from, uint256 amount) internal {
        _call(token, abi.encodeWithSignature("transferFrom(address,address,uint256)", from, address(this), amount));
    }

    function _push(address token, address to, uint256 amount) internal {
        _call(token, abi.encodeWithSignature("transfer(address,uint256)", to, amount));
    }

    /// @dev Accepts the empty return of some tokens and a boolean true.
    function _call(address token, bytes memory data) internal {
        (bool ok, bytes memory ret) = token.call(data);
        if (!ok || (ret.length != 0 && !abi.decode(ret, (bool)))) revert TransferFailed();
    }

    /// @dev floor(a * b / d) with a 512-bit intermediate.
    function _mulDiv(uint256 a, uint256 b, uint256 d) internal pure returns (uint256 result) {
        uint256 lo;
        uint256 hi;
        assembly {
            let mm := mulmod(a, b, not(0))
            lo := mul(a, b)
            hi := sub(sub(mm, lo), lt(mm, lo))
        }
        if (hi == 0) return lo / d;
        if (d <= hi) revert BadInput();
        uint256 rem;
        assembly {
            rem := mulmod(a, b, d)
            hi := sub(hi, gt(rem, lo))
            lo := sub(lo, rem)
        }
        unchecked {
            uint256 twos = d & (~d + 1);
            assembly {
                d := div(d, twos)
                lo := div(lo, twos)
                twos := add(div(sub(0, twos), twos), 1)
            }
            lo |= hi * twos;
            uint256 inv = (3 * d) ^ 2;
            inv *= 2 - d * inv;
            inv *= 2 - d * inv;
            inv *= 2 - d * inv;
            inv *= 2 - d * inv;
            inv *= 2 - d * inv;
            inv *= 2 - d * inv;
            result = lo * inv;
        }
    }
}
