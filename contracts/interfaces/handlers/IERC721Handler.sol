// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IERC721Handler {
    event DepositedERC721(
        address token,
        uint256 tokenId,
        string receiver,
        string network,
        bool isWrapped
    );

    function depositERC721(
        address token_,
        uint256 tokenId_,
        string calldata receiver_,
        string calldata network_,
        bool isWrapped_
    ) external;
}
