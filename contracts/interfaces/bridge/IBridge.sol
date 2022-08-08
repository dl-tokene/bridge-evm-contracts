// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../handlers/IERC20Handler.sol";
import "../handlers/IERC721Handler.sol";
import "../handlers/IERC1155Handler.sol";
import "../handlers/INativeHandler.sol";

interface IBridge is IERC20Handler, IERC721Handler, IERC1155Handler, INativeHandler {
    /**
     * @notice function for withdrawing erc20 tokens
     * @param token_ the address of withdrawn token
     * @param amount_ the amount of withdrawn tokens
     * @param txHash_ the hash of deposit tranaction
     * @param txNonce_ the nonce of deposit transaction
     * @param isWrapped_ the boolean flag, if true - tokens will minted, false - tokens will transferred
     * @param signatures_ the array of signatures. Formed by signing a sign hash by each signer.
     */
    function withdrawERC20(
        address token_,
        uint256 amount_,
        bytes32 txHash_,
        uint256 txNonce_,
        bool isWrapped_,
        bytes[] calldata signatures_
    ) external;

    /**
     * @notice function for withdrawing erc721 tokens
     * @param token_ the address of withdrawn token
     * @param tokenId_ the id of withdrawn token
     * @param txHash_ the hash of deposit tranaction
     * @param txNonce_ the nonce of deposit transaction
     * @param isWrapped_ the boolean flag, if true - tokens will minted, false - tokens will transferred
     * @param signatures_ the array of signatures. Formed by signing a sign hash by each signer.
     */
    function withdrawERC721(
        address token_,
        uint256 tokenId_,
        bytes32 txHash_,
        uint256 txNonce_,
        bool isWrapped_,
        bytes[] calldata signatures_
    ) external;

    /**
     * @notice function for withdrawing erc1155 tokens
     * @param token_ the address of withdrawn token
     * @param tokenId_ the id of withdrawn token
     * @param amount_ the amount of withdrawn tokens
     * @param txHash_ the hash of deposit tranaction
     * @param txNonce_ the nonce of deposit transaction
     * @param isWrapped_ the boolean flag, if true - tokens will minted, false - tokens will transferred
     * @param signatures_ the array of signatures. Formed by signing a sign hash by each signer.
     */
    function withdrawERC1155(
        address token_,
        uint256 tokenId_,
        uint256 amount_,
        bytes32 txHash_,
        uint256 txNonce_,
        bool isWrapped_,
        bytes[] calldata signatures_
    ) external;

    /**
     * @notice function for withdrawing native currency
     * @param amount_ the amount of withdrawn native currency
     * @param txHash_ the hash of deposit tranaction
     * @param txNonce_ the nonce of deposit transaction
     * @param signatures_ the array of signatures. Formed by signing a sign hash by each signer.
     */
    function withdrawNative(
        uint256 amount_,
        bytes32 txHash_,
        uint256 txNonce_,
        bytes[] calldata signatures_
    ) external;
}
