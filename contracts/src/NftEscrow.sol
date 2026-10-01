// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IErc20Move {
    function transfer(address, uint256) external returns (bool);
    function transferFrom(address, address, uint256) external returns (bool);
}

interface IErc721Move {
    function transferFrom(address from, address to, uint256 id) external;
}

/// @notice One NFT against a fixed USDC loan. The lender names the collection, and a
///         token id unless any token in that collection is accepted. The lender locks
///         the principal. The borrower locks that NFT and receives the principal.
///         Repay before the due date and the NFT comes back. After the due date the
///         lender takes it. An unfilled offer can be cancelled.
contract NftEscrow {
    struct Loan {
        address lender;
        address borrower;
        address nft;
        uint256 tokenId;
        uint256 principal;
        uint256 repay;
        uint64 due;
        bool anyId;
        bool filled;
        bool open;
    }

    address public immutable usdc;
    Loan[] public loans;

    error BadInput();
    error NotLender();
    error NotBorrower();
    error NotOpen();
    error NotDue();
    error WrongNft();
    error TransferFailed();

    event Offered(
        uint256 indexed id,
        address indexed lender,
        address indexed nft,
        uint256 tokenId,
        bool anyId,
        uint256 principal,
        uint256 repay,
        uint64 due
    );
    event Filled(uint256 indexed id, address indexed borrower, address nft, uint256 tokenId);
    event Repaid(uint256 indexed id);
    event Claimed(uint256 indexed id);
    event Cancelled(uint256 indexed id);

    constructor(address usdc_) {
        if (usdc_ == address(0)) revert BadInput();
        usdc = usdc_;
    }

    function loanCount() external view returns (uint256) {
        return loans.length;
    }

    function offer(
        address nft,
        uint256 tokenId,
        bool anyId,
        uint256 principal,
        uint256 repayment,
        uint64 due
    ) external returns (uint256 id) {
        if (nft == address(0) || principal == 0 || repayment < principal || due <= block.timestamp) revert BadInput();
        if (!IErc20Move(usdc).transferFrom(msg.sender, address(this), principal)) revert TransferFailed();
        id = loans.length;
        loans.push(
            Loan({
                lender: msg.sender,
                borrower: address(0),
                nft: nft,
                tokenId: anyId ? 0 : tokenId,
                principal: principal,
                repay: repayment,
                due: due,
                anyId: anyId,
                filled: false,
                open: true
            })
        );
        emit Offered(id, msg.sender, nft, anyId ? 0 : tokenId, anyId, principal, repayment, due);
    }

    function fill(uint256 id, uint256 tokenId) external {
        Loan storage loan = loans[id];
        if (!loan.open || loan.filled) revert NotOpen();
        if (!loan.anyId && tokenId != loan.tokenId) revert WrongNft();
        uint256 locked = loan.anyId ? tokenId : loan.tokenId;
        loan.borrower = msg.sender;
        loan.tokenId = locked;
        loan.filled = true;
        IErc721Move(loan.nft).transferFrom(msg.sender, address(this), locked);
        if (!IErc20Move(usdc).transfer(msg.sender, loan.principal)) revert TransferFailed();
        emit Filled(id, msg.sender, loan.nft, locked);
    }

    function cancel(uint256 id) external {
        Loan storage loan = loans[id];
        if (!loan.open || loan.filled) revert NotOpen();
        if (msg.sender != loan.lender) revert NotLender();
        loan.open = false;
        if (!IErc20Move(usdc).transfer(loan.lender, loan.principal)) revert TransferFailed();
        emit Cancelled(id);
    }

    function repay(uint256 id) external {
        Loan storage loan = loans[id];
        if (!loan.open || !loan.filled) revert NotOpen();
        if (msg.sender != loan.borrower) revert NotBorrower();
        loan.open = false;
        if (!IErc20Move(usdc).transferFrom(msg.sender, loan.lender, loan.repay)) revert TransferFailed();
        IErc721Move(loan.nft).transferFrom(address(this), loan.borrower, loan.tokenId);
        emit Repaid(id);
    }

    function claim(uint256 id) external {
        Loan storage loan = loans[id];
        if (!loan.open || !loan.filled) revert NotOpen();
        if (msg.sender != loan.lender) revert NotLender();
        if (block.timestamp < loan.due) revert NotDue();
        loan.open = false;
        IErc721Move(loan.nft).transferFrom(address(this), loan.lender, loan.tokenId);
        emit Claimed(id);
    }
}
