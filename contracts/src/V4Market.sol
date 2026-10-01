// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IV4State {
    function getSlot0(bytes32 poolId)
        external
        view
        returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee);
}

interface IV4Manager {
    function unlock(bytes calldata data) external returns (bytes memory);
    function swap(PoolKey calldata key, SwapParams calldata params, bytes calldata hookData) external returns (int256);
    function sync(address currency) external;
    function settle() external returns (uint256);
    function take(address currency, address to, uint256 amount) external;
}

struct PoolKey {
    address currency0;
    address currency1;
    uint24 fee;
    int24 tickSpacing;
    address hooks;
}

struct SwapParams {
    bool zeroForOne;
    int256 amountSpecified;
    uint160 sqrtPriceLimitX96;
}

interface IV4Callback {
    function uniswapV3SwapCallback(int256 amount0Delta, int256 amount1Delta, bytes calldata data) external;
}

interface IV4Erc20 {
    function balanceOf(address) external view returns (uint256);
    function transfer(address, uint256) external returns (bool);
}

/// @notice Presents one Uniswap v4 pool as the V3 market LendingPool already calls.
///         Nothing is deposited here. Price and sales use the existing v4 liquidity.
contract V4Market {
    uint160 private constant MIN_SQRT = 4295128740;
    uint160 private constant MAX_SQRT = 1461446703485210103287273052203988822378723970341;

    address public immutable token0;
    address public immutable token1;
    address public immutable manager;
    address public immutable stateView;
    bytes32 public immutable poolId;
    PoolKey private _key;
    error BadInput();
    error NotManager();

    constructor(
        address token,
        address usdc,
        address manager_,
        address stateView_,
        bytes32 poolId_,
        uint24 fee,
        int24 tickSpacing,
        address hooks
    ) {
        if (token == address(0) || usdc == address(0) || token == usdc || manager_ == address(0) || stateView_ == address(0)) {
            revert BadInput();
        }
        (address c0, address c1) = token < usdc ? (token, usdc) : (usdc, token);
        token0 = c0;
        token1 = c1;
        manager = manager_;
        stateView = stateView_;
        poolId = poolId_;
        _key = PoolKey(c0, c1, fee, tickSpacing, hooks);
    }

    function slot0()
        external
        view
        returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, uint8, bool)
    {
        (uint160 sqrtPrice, int24 currentTick,,) = IV4State(stateView).getSlot0(poolId);
        return (sqrtPrice, currentTick, 0, 0, 0, 0, true);
    }

    /// @dev The v4 pool does not store an average. The tick it has right now is the price.
    function observe(uint32[] calldata secondsAgos)
        external
        view
        returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s)
    {
        (, int24 currentTick,,) = IV4State(stateView).getSlot0(poolId);
        uint256 n = secondsAgos.length;
        tickCumulatives = new int56[](n);
        secondsPerLiquidityCumulativeX128s = new uint160[](n);
        for (uint256 i = 0; i < n; i++) {
            uint256 past = block.timestamp - secondsAgos[i];
            tickCumulatives[i] = int56(currentTick) * int56(uint56(past));
        }
    }

    function increaseObservationCardinalityNext(uint16) external {}

    function swap(address recipient, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96, bytes calldata data)
        external
        returns (int256 amount0, int256 amount1)
    {
        if (amountSpecified <= 0 || recipient == address(0)) revert BadInput();
        bytes memory result = IV4Manager(manager).unlock(abi.encode(msg.sender, recipient, zeroForOne, amountSpecified, sqrtPriceLimitX96, data));
        (amount0, amount1) = abi.decode(result, (int256, int256));
    }

    function unlockCallback(bytes calldata raw) external returns (bytes memory) {
        if (msg.sender != manager) revert NotManager();
        (address payer, address recipient, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96, bytes memory data) =
            abi.decode(raw, (address, address, bool, int256, uint160, bytes));
        uint160 limit = sqrtPriceLimitX96 == 0 ? (zeroForOne ? MIN_SQRT : MAX_SQRT) : sqrtPriceLimitX96;
        int256 delta = IV4Manager(manager).swap(_key, SwapParams(zeroForOne, amountSpecified, limit), "");
        int128 d0;
        int128 d1;
        assembly {
            d0 := sar(128, delta)
            d1 := signextend(15, delta)
        }
        if (d0 < 0) _pay(token0, payer, data, uint256(uint128(-d0)));
        if (d1 < 0) _pay(token1, payer, data, uint256(uint128(-d1)));
        if (d0 > 0) IV4Manager(manager).take(token0, recipient, uint256(uint128(d0)));
        if (d1 > 0) IV4Manager(manager).take(token1, recipient, uint256(uint128(d1)));
        return abi.encode(int256(d0), int256(d1));
    }

    function _pay(address token, address payer, bytes memory data, uint256 amount) internal {
        uint256 before = IV4Erc20(token).balanceOf(address(this));
        IV4Callback(payer).uniswapV3SwapCallback(token == token0 ? int256(amount) : int256(0), token == token1 ? int256(amount) : int256(0), data);
        uint256 got = IV4Erc20(token).balanceOf(address(this)) - before;
        if (got < amount) revert BadInput();
        IV4Manager(manager).sync(token);
        _transfer(token, manager, amount);
        IV4Manager(manager).settle();
    }

    function _transfer(address token, address to, uint256 amount) internal {
        (bool ok, bytes memory ret) = token.call(abi.encodeWithSignature("transfer(address,uint256)", to, amount));
        if (!ok || (ret.length != 0 && !abi.decode(ret, (bool)))) revert BadInput();
    }
}
