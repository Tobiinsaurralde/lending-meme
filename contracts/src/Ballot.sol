// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IStakeWeight {
    function stakedOf(address account) external view returns (uint256);
}

/// @notice One vote per staker per proposal. The weight is the BAG they have
///         staked at the moment they vote.
contract Ballot {
    struct Proposal {
        string title;
        uint256 forVotes;
        uint256 againstVotes;
        bool open;
    }

    address public immutable vault;
    address public owner;
    Proposal[] public proposals;
    mapping(uint256 => mapping(address => bool)) public voted;

    error BadInput();
    error NotOwner();
    error Closed();
    error Already();
    error NoWeight();

    event Proposed(uint256 indexed id, string title);
    event Voted(uint256 indexed id, address indexed account, bool support, uint256 weight);

    constructor(address vault_) {
        if (vault_ == address(0)) revert BadInput();
        vault = vault_;
        owner = msg.sender;
    }

    function proposalCount() external view returns (uint256) {
        return proposals.length;
    }

    function propose(string calldata title) external returns (uint256 id) {
        if (msg.sender != owner || bytes(title).length == 0) revert NotOwner();
        id = proposals.length;
        proposals.push(Proposal(title, 0, 0, true));
        emit Proposed(id, title);
    }

    function close(uint256 id) external {
        if (msg.sender != owner) revert NotOwner();
        proposals[id].open = false;
    }

    function vote(uint256 id, bool support) external {
        Proposal storage item = proposals[id];
        if (!item.open) revert Closed();
        if (voted[id][msg.sender]) revert Already();
        uint256 weight = IStakeWeight(vault).stakedOf(msg.sender);
        if (weight == 0) revert NoWeight();
        voted[id][msg.sender] = true;
        if (support) item.forVotes += weight;
        else item.againstVotes += weight;
        emit Voted(id, msg.sender, support, weight);
    }
}
