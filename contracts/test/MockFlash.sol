// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IMarketFlash {
    function flash(uint256 amount, bytes calldata data) external;
    function usdc() external view returns (address);
}

interface IErc20Flash {
    function transfer(address, uint256) external returns (bool);
}

/// @notice Borrows USDC and pays it back inside the callback.
contract MockFlash {
    function go(address market, uint256 amount) external {
        IMarketFlash(market).flash(amount, "");
    }

    function onFlashLoan(uint256 amount, bytes calldata) external {
        address usdc = IMarketFlash(msg.sender).usdc();
        require(IErc20Flash(usdc).transfer(msg.sender, amount), "repay");
    }
}
