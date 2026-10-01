// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IERC20Min {
    function balanceOf(address) external view returns (uint256);
    function transfer(address, uint256) external returns (bool);
}

/// @notice Uniswap V2 pair math for tests: reserves, cumulative prices, fee and the K check.
contract MockV2Pair {
    address public immutable token0;
    address public immutable token1;
    uint256 public immutable feeBps;

    uint112 private reserve0;
    uint112 private reserve1;
    uint32 private blockTimestampLast;
    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;

    constructor(address a, address b, uint256 feeBps_) {
        (token0, token1) = a < b ? (a, b) : (b, a);
        feeBps = feeBps_;
    }

    function getReserves() external view returns (uint112, uint112, uint32) {
        return (reserve0, reserve1, blockTimestampLast);
    }

    function sync() external {
        _update(IERC20Min(token0).balanceOf(address(this)), IERC20Min(token1).balanceOf(address(this)));
    }

    function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata) external {
        require(amount0Out > 0 || amount1Out > 0, "out");
        require(amount0Out < reserve0 && amount1Out < reserve1, "liquidity");
        if (amount0Out > 0) IERC20Min(token0).transfer(to, amount0Out);
        if (amount1Out > 0) IERC20Min(token1).transfer(to, amount1Out);
        uint256 b0 = IERC20Min(token0).balanceOf(address(this));
        uint256 b1 = IERC20Min(token1).balanceOf(address(this));
        uint256 in0 = b0 > reserve0 - amount0Out ? b0 - (reserve0 - amount0Out) : 0;
        uint256 in1 = b1 > reserve1 - amount1Out ? b1 - (reserve1 - amount1Out) : 0;
        require(in0 > 0 || in1 > 0, "in");
        uint256 a0 = b0 * 10_000 - in0 * feeBps;
        uint256 a1 = b1 * 10_000 - in1 * feeBps;
        require(a0 * a1 >= uint256(reserve0) * reserve1 * 1e8, "K");
        _update(b0, b1);
    }

    function _update(uint256 b0, uint256 b1) private {
        uint32 nowTs = uint32(block.timestamp);
        unchecked {
            uint32 elapsed = nowTs - blockTimestampLast;
            if (elapsed > 0 && reserve0 != 0 && reserve1 != 0) {
                price0CumulativeLast += ((uint256(reserve1) << 112) / reserve0) * elapsed;
                price1CumulativeLast += ((uint256(reserve0) << 112) / reserve1) * elapsed;
            }
        }
        reserve0 = uint112(b0);
        reserve1 = uint112(b1);
        blockTimestampLast = nowTs;
    }
}
