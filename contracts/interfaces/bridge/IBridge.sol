// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IERC20Handler} from "../handlers/IERC20Handler.sol";
import {IERC721Handler} from "../handlers/IERC721Handler.sol";
import {IERC1155Handler} from "../handlers/IERC1155Handler.sol";
import {INativeHandler} from "../handlers/INativeHandler.sol";

/**
 * @title The Bridge Contract
 *
 * The Bridge contract facilitates the permissioned transfer of assets (ERC20, ERC721, ERC1155, Native) between two different blockchains.
 *
 * To utilize the Bridge effectively, instances of the contract must be deployed on both the base and destination chains,
 * accompanied by the setup of a trusted backend to act as a `signer`.
 *
 * The Bridge contract supports both the liquidity pool method and the mint-and-burn method for transferring assets.
 * Users can either deposit or withdraw assets through the contract during a transfer operation.
 *
 * IMPORTANT:
 * All signer addresses must differ in their first (most significant) 8 bits in order to pass a bloom filtering.
 */
interface IBridge is IERC20Handler, IERC721Handler, IERC1155Handler, INativeHandler {
    /**
     * @notice Withdraws ERC20 tokens.
     * @param token_ The address of the token to withdraw.
     * @param amount_ The amount of tokens to withdraw.
     * @param receiver_ The address of the withdrawal recipient.
     * @param txHash_ The hash of the deposit transaction.
     * @param txNonce_ The nonce of the deposit transaction.
     * @param operationType_ The type of bridging operation.
     * @param signatures_ An array of signatures, formed by signing a sign hash by each signer.
     */
    function withdrawERC20(
        address token_,
        uint256 amount_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        ERC20BridgingType operationType_,
        bytes[] calldata signatures_
    ) external;

    /**
     * @notice Withdraws ERC721 tokens.
     * @param token_ The address of the token to withdraw.
     * @param tokenId_ The ID of the token to withdraw.
     * @param receiver_ The address of the withdrawal recipient.
     * @param txHash_ The hash of the deposit transaction.
     * @param txNonce_ The nonce of the deposit transaction.
     * @param tokenURI_ The string URI of the token metadata.
     * @param operationType_ The type of bridging operation.
     * @param signatures_ An array of signatures, formed by signing a sign hash by each signer.
     */
    function withdrawERC721(
        address token_,
        uint256 tokenId_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        string calldata tokenURI_,
        ERC721BridgingType operationType_,
        bytes[] calldata signatures_
    ) external;

    /**
     * @notice Withdraws ERC1155 tokens.
     * @param token_ The address of the token to withdraw.
     * @param tokenId_ The ID of the token to withdraw.
     * @param amount_ The amount of tokens to withdraw.
     * @param receiver_ The address of the withdrawal recipient.
     * @param txHash_ The hash of the deposit transaction.
     * @param txNonce_ The nonce of the deposit transaction.
     * @param tokenURI_ The string URI of the token metadata.
     * @param operationType_ The type of bridging operation.
     * @param signatures_ An array of signatures, formed by signing a sign hash by each signer.
     */
    function withdrawERC1155(
        address token_,
        uint256 tokenId_,
        uint256 amount_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        string calldata tokenURI_,
        ERC1155BridgingType operationType_,
        bytes[] calldata signatures_
    ) external;

    /**
     * @notice Withdraws native currency.
     * @param amount_ The amount of native currency to withdraw.
     * @param receiver_ The address of the withdrawal recipient.
     * @param txHash_ The hash of the deposit transaction.
     * @param txNonce_ The nonce of the deposit transaction.
     * @param signatures_ An array of signatures, formed by signing a sign hash by each signer.
     */
    function withdrawNative(
        uint256 amount_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        bytes[] calldata signatures_
    ) external;
}
