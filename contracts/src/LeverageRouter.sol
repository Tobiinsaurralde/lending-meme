// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IMarket {
    function collateral() external view returns (address);
    function borrow(uint256 amount) external returns (uint256 assets);
}

interface ISwap {
    /// @notice Pull `usdcIn` from the caller and send collateral back.
    function swap(address collateral, uint256 usdcIn) external returns (uint256 bought);
}

interface IErc20 {
    function balanceOf(address) external view returns (uint256);
    function transfer(address, uint256) external returns (bool);
    function transferFrom(address, address, uint256) external returns (bool);
    function approve(address, uint256) external returns (bool);
}

/// @title LeverageRouter
/// @notice One loop per market. Locks collateral, borrows USDC, swaps it for
///         more collateral and borrows again. The user repays through `repay`.
contract LeverageRouter {
    address public immutable usdc;

    struct Loop {
        address owner;
        address market;
    }

    Loop[] public loops;
    mapping(address => mapping(address => uint256)) public loopOf;
    mapping(address => address) public ownerOf;

    error BadInput();
    error NotOwner();
    error TransferFailed();
    error Short();

    constructor(address usdc_) {
        if (usdc_ == address(0)) revert BadInput();
        usdc = usdc_;
    }

    /// @notice Lock `seed`, borrow USDC, swap it for more collateral, and borrow again.
    ///         One open loop per market. The debt sits on this router.
    function open(address market, uint256 seed, address swapper) external returns (uint256 id) {
        if (market == address(0) || swapper == address(0) || seed == 0) revert BadInput();
        if (loopOf[msg.sender][market] != 0 || ownerOf[market] != address(0)) revert BadInput();

        id = loops.length;
        if (id == 0) {
            loops.push(Loop(address(0), address(0)));
            id = 1;
        }
        loops.push(Loop(msg.sender, market));
        loopOf[msg.sender][market] = id;
        ownerOf[market] = msg.sender;

        address token = IMarket(market).collateral();
        _pull(token, msg.sender, seed);
        if (!IErc20(token).approve(market, seed)) revert TransferFailed();
        uint256 got = IMarket(market).borrow(seed);
        if (got == 0) revert Short();

        if (!IErc20(usdc).approve(swapper, got)) revert TransferFailed();
        ISwap(swapper).swap(token, got);
        uint256 bought = IErc20(token).balanceOf(address(this));
        if (bought == 0) revert Short();
        if (!IErc20(token).approve(market, bought)) revert TransferFailed();
        IMarket(market).borrow(bought);
    }

    function repay(address market, uint256 assets) external {
        uint256 id = loopOf[msg.sender][market];
        if (id == 0 || loops[id].owner != msg.sender) revert NotOwner();
        _pull(usdc, msg.sender, assets);
        if (!IErc20(usdc).approve(market, assets)) revert TransferFailed();
        (bool ok, bytes memory ret) = market.call(abi.encodeWithSignature("repay(uint256)", assets));
        if (!ok) _bubble(ret);
        uint256 leftover = IErc20(usdc).balanceOf(address(this));
        if (leftover > 0) _push(usdc, msg.sender, leftover);
        address token = IMarket(market).collateral();
        uint256 col = IErc20(token).balanceOf(address(this));
        if (col > 0) _push(token, msg.sender, col);
    }

    function _pull(address token, address from, uint256 amount) internal {
        if (!IErc20(token).transferFrom(from, address(this), amount)) revert TransferFailed();
    }

    function _push(address token, address to, uint256 amount) internal {
        if (!IErc20(token).transfer(to, amount)) revert TransferFailed();
    }

    function _bubble(bytes memory ret) internal pure {
        assembly {
            revert(add(ret, 32), mload(ret))
        }
    }
}
