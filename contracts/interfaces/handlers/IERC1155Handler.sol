// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IERC1155Handler {
    event DepositedERC1155(
        address token,
        uint256 tokenId,
        uint256 tokenAmount,
        string receiver,
        string network,
        bool isWrapped
    );

    function depositERC1155(
        address token_,
        uint256 tokenId_,
        uint256 amount_,
        string calldata receiver_,
        string calldata network_,
        bool isWrapped_
    ) external;
}
