// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @notice Arc projects ask BagFi to open a USDC loan against their token.
///         A request records the token and a contact. It does not move funds
///         and it does not list the token. The owner still opens the market.
contract DeveloperInbox {
    struct Request {
        address applicant;
        address token;
        address pool;
        uint8 venue;
        uint64 createdAt;
        bool open;
        string project;
        string contact;
    }

    address public owner;
    uint256 public nextId;
    mapping(uint256 => Request) public requests;
    /// @dev applicant => token => id + 1 while that pair has an open request.
    mapping(address => mapping(address => uint256)) public openOf;

    event Requested(
        uint256 indexed id,
        address indexed applicant,
        address indexed token,
        address pool,
        uint8 venue,
        string project,
        string contact
    );
    event Closed(uint256 indexed id);
    event OwnerSet(address indexed owner);

    error BadInput();
    error NotOwner();
    error ClosedRequest();
    error Exists();

    constructor(address owner_) {
        if (owner_ == address(0)) revert BadInput();
        owner = owner_;
    }

    function submit(
        address token,
        address pool,
        uint8 venue,
        string calldata project,
        string calldata contact
    ) external returns (uint256 id) {
        if (token == address(0) || pool == token) revert BadInput();
        if (bytes(project).length == 0 || bytes(project).length > 64) revert BadInput();
        if (bytes(contact).length == 0 || bytes(contact).length > 80) revert BadInput();
        if (venue > 2) revert BadInput();
        if (openOf[msg.sender][token] != 0) revert Exists();

        id = nextId++;
        requests[id] = Request({
            applicant: msg.sender,
            token: token,
            pool: pool,
            venue: venue,
            createdAt: uint64(block.timestamp),
            open: true,
            project: project,
            contact: contact
        });
        openOf[msg.sender][token] = id + 1;
        emit Requested(id, msg.sender, token, pool, venue, project, contact);
    }

    function close(uint256 id) external {
        if (msg.sender != owner) revert NotOwner();
        Request storage row = requests[id];
        if (row.applicant == address(0) || !row.open) revert ClosedRequest();
        row.open = false;
        openOf[row.applicant][row.token] = 0;
        emit Closed(id);
    }

    function transferOwnership(address next) external {
        if (msg.sender != owner) revert NotOwner();
        if (next == address(0)) revert BadInput();
        owner = next;
        emit OwnerSet(next);
    }
}
