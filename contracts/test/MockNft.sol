// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract MockNft {
    mapping(uint256 => address) public ownerOf;
    mapping(address => mapping(address => bool)) public approvedForAll;

    function mint(address to, uint256 id) external {
        ownerOf[id] = to;
    }

    function setApprovalForAll(address operator, bool allowed) external {
        approvedForAll[msg.sender][operator] = allowed;
    }

    function transferFrom(address from, address to, uint256 id) external {
        require(ownerOf[id] == from, "owner");
        require(from == msg.sender || approvedForAll[from][msg.sender], "auth");
        ownerOf[id] = to;
    }
}
