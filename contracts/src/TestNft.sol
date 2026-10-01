// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @notice A worthless NFT for trying the escrow. Each mint goes to the caller
///         and gets a new id. Existing tokens cannot be overwritten.
contract TestNft {
    string public constant name = "BagFi Test NFT";
    string public constant symbol = "BAGNFT";

    uint256 public nextId = 1;
    mapping(uint256 => address) public ownerOf;
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    error NotOwner();

    event Transfer(address indexed from, address indexed to, uint256 indexed id);

    constructor() {
        ownerOf[1] = msg.sender;
        nextId = 2;
        emit Transfer(address(0), msg.sender, 1);
    }

    function mint() external returns (uint256 id) {
        id = nextId++;
        ownerOf[id] = msg.sender;
        emit Transfer(address(0), msg.sender, id);
    }

    function setApprovalForAll(address operator, bool allowed) external {
        isApprovedForAll[msg.sender][operator] = allowed;
    }

    function transferFrom(address from, address to, uint256 id) external {
        if (ownerOf[id] != from) revert NotOwner();
        if (from != msg.sender && !isApprovedForAll[from][msg.sender]) revert NotOwner();
        ownerOf[id] = to;
        emit Transfer(from, to, id);
    }
}
