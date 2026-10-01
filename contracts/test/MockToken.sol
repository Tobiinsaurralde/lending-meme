// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @notice Minimal ERC-20 for pool tests. `taxBps` burns part of every transfer
///         to stand in for memecoins that take a cut.
contract MockToken {
    string public name;
    string public symbol;
    uint8 public immutable decimals;
    uint256 public immutable taxBps;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory name_, string memory symbol_, uint8 decimals_, uint256 taxBps_) {
        name = name_;
        symbol = symbol_;
        decimals = decimals_;
        taxBps = taxBps_;
    }

    function mint(address to, uint256 amount) external {
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
        require(allowed >= amount, "allowance");
        allowance[from][msg.sender] = allowed - amount;
        _move(from, to, amount);
        return true;
    }

    function _move(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "balance");
        uint256 tax = (amount * taxBps) / 10_000;
        balanceOf[from] -= amount;
        balanceOf[to] += amount - tax;
        totalSupply -= tax;
    }
}
