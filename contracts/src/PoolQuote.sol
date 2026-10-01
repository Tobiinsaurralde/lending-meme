// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface ILendingPoolPrices {
    function priceOf(address token) external view returns (uint256 average, uint256 spot);
    function assets(address token)
        external
        view
        returns (
            bool enabled,
            uint8 decimals,
            uint8 venue,
            bool tokenIsToken0,
            uint16 swapFeeBps,
            uint16 maxSlippageBps,
            uint32 twapWindow,
            address market
        );
}

/// @notice Prices an amount with the live LendingPool oracle: the lower of the
///         30-minute average and the spot price, in USDC with 6 decimals.
contract PoolQuote {
    address public immutable pool;

    error BadInput();

    constructor(address pool_) {
        if (pool_ == address(0)) revert BadInput();
        pool = pool_;
    }

    function quote(address token, uint256 amount) external view returns (uint256) {
        (uint256 average, uint256 spot) = ILendingPoolPrices(pool).priceOf(token);
        (, uint8 decimals,,,,,,) = ILendingPoolPrices(pool).assets(token);
        uint256 price = average < spot ? average : spot;
        return (amount * price) / (10 ** decimals);
    }
}
