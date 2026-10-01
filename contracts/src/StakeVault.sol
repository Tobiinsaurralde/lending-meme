// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IBagUsdc {
    function transfer(address, uint256) external returns (bool);
    function transferFrom(address, address, uint256) external returns (bool);
}

/// @notice BAG token. The vault is the only minter.
contract BagToken {
    string public constant name = "BagFi";
    string public constant symbol = "BAG";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    address public immutable minter;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    error NotMinter();
    error TransferFailed();

    constructor(address minter_) {
        minter = minter_;
    }

    function mint(address to, uint256 amount) external {
        if (msg.sender != minter) revert NotMinter();
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _move(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < amount) revert TransferFailed();
            allowance[from][msg.sender] = allowed - amount;
        }
        _move(from, to, amount);
        return true;
    }

    function _move(address from, address to, uint256 amount) internal {
        if (balanceOf[from] < amount) revert TransferFailed();
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
    }
}

/// @notice Stake BAG. Anyone can fund the vault with USDC. Stakers claim a
///         share of what was funded while they were staked.
contract StakeVault {
    uint256 private constant SCALE = 1e18;

    BagToken public immutable bag;
    address public immutable usdc;
    address public owner;
    uint256 public staked;
    uint256 public accPerShare;
    mapping(address => uint256) public stakedOf;
    mapping(address => uint256) public debt;

    error BadInput();
    error NotOwner();
    error TransferFailed();

    event Staked(address indexed account, uint256 amount);
    event Unstaked(address indexed account, uint256 amount);
    event Funded(uint256 amount);
    event Claimed(address indexed account, uint256 amount);

    constructor(address usdc_) {
        if (usdc_ == address(0)) revert BadInput();
        usdc = usdc_;
        owner = msg.sender;
        bag = new BagToken(address(this));
    }

    function mint(address to, uint256 amount) external {
        if (msg.sender != owner || to == address(0) || amount == 0) revert NotOwner();
        bag.mint(to, amount);
    }

    function stake(uint256 amount) external {
        if (amount == 0) revert BadInput();
        _settle(msg.sender);
        if (!bag.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        stakedOf[msg.sender] += amount;
        staked += amount;
        debt[msg.sender] = (stakedOf[msg.sender] * accPerShare) / SCALE;
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external {
        if (amount == 0 || amount > stakedOf[msg.sender]) revert BadInput();
        _settle(msg.sender);
        stakedOf[msg.sender] -= amount;
        staked -= amount;
        debt[msg.sender] = (stakedOf[msg.sender] * accPerShare) / SCALE;
        if (!bag.transfer(msg.sender, amount)) revert TransferFailed();
        emit Unstaked(msg.sender, amount);
    }

    function fund(uint256 amount) external {
        if (amount == 0 || staked == 0) revert BadInput();
        if (!IBagUsdc(usdc).transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        accPerShare += (amount * SCALE) / staked;
        emit Funded(amount);
    }

    function claim() external returns (uint256 amount) {
        amount = pending(msg.sender);
        if (amount == 0) return 0;
        debt[msg.sender] = (stakedOf[msg.sender] * accPerShare) / SCALE;
        if (!IBagUsdc(usdc).transfer(msg.sender, amount)) revert TransferFailed();
        emit Claimed(msg.sender, amount);
    }

    function pending(address account) public view returns (uint256) {
        uint256 grown = (stakedOf[account] * accPerShare) / SCALE;
        uint256 owed = debt[account];
        return grown > owed ? grown - owed : 0;
    }

    function _settle(address account) internal {
        uint256 amount = pending(account);
        if (amount == 0) return;
        debt[account] = (stakedOf[account] * accPerShare) / SCALE;
        if (!IBagUsdc(usdc).transfer(account, amount)) revert TransferFailed();
    }
}
