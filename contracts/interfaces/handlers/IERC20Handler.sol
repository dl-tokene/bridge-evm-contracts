// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IERC20Handler {
    event DepositedERC20(
        address token,
        uint256 amount,
        string receiver,
        string network,
        bool isWrapped
    );

    function depositERC20(
        address token_,
        uint256 amount_,
        string calldata receiver_,
        string calldata network_,
        bool isWrapped_
    ) external;
}
