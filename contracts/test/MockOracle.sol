// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @notice Test quote: `price` is USDC (6 decimals) for one whole token (1e18).
contract MockOracle {
    mapping(address => uint256) public price;

    function set(address token, uint256 price_) external {
        price[token] = price_;
    }

    function quote(address token, uint256 amount) external view returns (uint256) {
        return (amount * price[token]) / 1e18;
    }
}
