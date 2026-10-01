// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IMint {
    function mint(address to, uint256 amount) external;
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @notice Pulls USDC and mints collateral to the caller at a fixed rate.
///         `tokensPerUsdc` is token wei per 1 USDC (1e6).
contract MockSwap {
    address public immutable usdc;
    uint256 public tokensPerUsdc;

    constructor(address usdc_, uint256 tokensPerUsdc_) {
        usdc = usdc_;
        tokensPerUsdc = tokensPerUsdc_;
    }

    function swap(address collateral, uint256 usdcIn) external returns (uint256 bought) {
        require(IMint(usdc).transferFrom(msg.sender, address(this), usdcIn), "usdc");
        bought = (usdcIn * tokensPerUsdc) / 1e6;
        IMint(collateral).mint(msg.sender, bought);
    }
}
