// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IsolatedMarket} from "./IsolatedMarket.sol";

/// @notice Deploys one isolated USDC market per collateral.
contract MarketFactory {
    address public immutable usdc;
    address public owner;

    address[] public markets;
    mapping(address => address) public marketOf;

    event MarketCreated(address indexed collateral, address indexed market);
    event OwnerSet(address indexed owner);

    error BadInput();
    error Exists();
    error NotOwner();

    constructor(address usdc_, address owner_) {
        if (usdc_ == address(0) || owner_ == address(0)) revert BadInput();
        usdc = usdc_;
        owner = owner_;
    }

    function marketCount() external view returns (uint256) {
        return markets.length;
    }

    function create(
        address collateral,
        address oracle,
        address treasury,
        uint16 maxLtvBps,
        uint16 lltvBps,
        uint16 bonusBps,
        uint16 kinkBps,
        uint16 rateAtKinkBps,
        uint16 rateMaxBps,
        uint16 reserveBps
    ) external returns (address market) {
        if (msg.sender != owner) revert NotOwner();
        if (collateral == address(0) || marketOf[collateral] != address(0)) revert Exists();
        market = address(
            new IsolatedMarket(
                usdc,
                collateral,
                oracle,
                treasury,
                maxLtvBps,
                lltvBps,
                bonusBps,
                kinkBps,
                rateAtKinkBps,
                rateMaxBps,
                reserveBps
            )
        );
        marketOf[collateral] = market;
        markets.push(market);
        emit MarketCreated(collateral, market);
    }

    function transferOwnership(address next) external {
        if (msg.sender != owner) revert NotOwner();
        if (next == address(0)) revert BadInput();
        owner = next;
        emit OwnerSet(next);
    }
}
