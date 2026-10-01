// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IBuyerErc20 {
    function balanceOf(address) external view returns (uint256);
    function transfer(address, uint256) external returns (bool);
    function transferFrom(address, address, uint256) external returns (bool);
}

interface IBuyerPool {
    function swap(address recipient, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96, bytes calldata data)
        external
        returns (int256 amount0, int256 amount1);
}

/// @notice Buys a token with USDC on its Uniswap V3 pool and sends the token
///         to the caller. Used by the leverage router.
contract PoolBuyer {
    uint160 private constant MIN_SQRT = 4295128740;
    uint160 private constant MAX_SQRT = 1461446703485210103287273052203988822378723970341;

    address public immutable usdc;
    address public owner;
    mapping(address => address) public poolOf;
    mapping(address => bool) public tokenIsToken0;
    address private _pool;

    error BadInput();
    error NotOwner();
    error TransferFailed();

    constructor(address usdc_) {
        if (usdc_ == address(0)) revert BadInput();
        usdc = usdc_;
        owner = msg.sender;
    }

    function setPool(address token, address pool, bool isToken0) external {
        if (msg.sender != owner || token == address(0) || pool == address(0)) revert NotOwner();
        poolOf[token] = pool;
        tokenIsToken0[token] = isToken0;
    }

    /// @notice Pull USDC from the caller, buy `collateral`, and send it back.
    function swap(address collateral, uint256 usdcIn) external returns (uint256 bought) {
        address pool = poolOf[collateral];
        if (pool == address(0) || usdcIn == 0) revert BadInput();
        if (!IBuyerErc20(usdc).transferFrom(msg.sender, address(this), usdcIn)) revert TransferFailed();
        _pool = pool;
        bool zeroForOne = !tokenIsToken0[collateral];
        uint160 limit = zeroForOne ? MIN_SQRT + 1 : MAX_SQRT - 1;
        uint256 before = IBuyerErc20(collateral).balanceOf(msg.sender);
        IBuyerPool(pool).swap(msg.sender, zeroForOne, int256(usdcIn), limit, "");
        _pool = address(0);
        bought = IBuyerErc20(collateral).balanceOf(msg.sender) - before;
    }

    function uniswapV3SwapCallback(int256 amount0Delta, int256 amount1Delta, bytes calldata) external {
        if (msg.sender != _pool || _pool == address(0)) revert BadInput();
        int256 owed = amount0Delta > 0 ? amount0Delta : amount1Delta;
        if (owed > 0 && !IBuyerErc20(usdc).transfer(msg.sender, uint256(owed))) revert TransferFailed();
    }
}
