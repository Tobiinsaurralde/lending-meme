// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IFlashMarket {
    function flash(uint256 amount, bytes calldata data) external;
    function usdc() external view returns (address);
}

interface IFlashUsdc {
    function transfer(address, uint256) external returns (bool);
}

/// @notice Calls a market flash loan and repays it in the same transaction.
///         A wallet cannot do this itself, because the market calls back.
contract FlashHelper {
    function go(address market, uint256 amount) external {
        IFlashMarket(market).flash(amount, "");
    }

    function onFlashLoan(uint256 amount, bytes calldata) external {
        address usdc = IFlashMarket(msg.sender).usdc();
        require(IFlashUsdc(usdc).transfer(msg.sender, amount), "repay");
    }
}
