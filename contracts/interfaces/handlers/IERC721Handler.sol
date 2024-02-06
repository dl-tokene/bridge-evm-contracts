// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title IERC721Handler
 */
interface IERC721Handler {
    /**
     * @notice Enumerates the types of ERC721 token bridging options.
     */
    enum ERC721BridgingType {
        LiquidityPool,
        Wrapped
    }

    /**
     * @dev Emitted when ERC721 tokens are deposited for bridging.
     * @param token The address of the ERC721 token being bridged.
     * @param tokenId The ID of the token deposited for bridging.
     * @param receiver The receiver's address in the destination network.
     * @param network The name of the destination network.
     * @param operationType The type of bridging operation performed.
     */
    event DepositedERC721(
        address token,
        uint256 tokenId,
        string receiver,
        string network,
        ERC721BridgingType operationType
    );

    /**
     * @notice Deposits ERC721 tokens for bridging, emitting a `DepositedERC721` event.
     * @param token_ The address of the deposited token.
     * @param tokenId_ The ID of the deposited token.
     * @param receiver_ The receiver's address in the destination network, used as an informational field for the event.
     * @param network_ The name of the destination network, used as an informational field for the event.
     * @param operationType_ The type of bridging operation being performed.
     */
    function depositERC721(
        address token_,
        uint256 tokenId_,
        string calldata receiver_,
        string calldata network_,
        ERC721BridgingType operationType_
    ) external;

    /**
     * @notice Generates a hash for signing, related to a specific ERC721 bridging operation.
     * @param token_ The address of the token being withdrawn.
     * @param tokenId_ The ID of the deposited token.
     * @param receiver_ The receiver's address in the destination network.
     * @param txHash_ The hash of the deposit transaction.
     * @param txNonce_ The nonce of the deposit transaction.
     * @param chainId_ The ID of the chain where the operation is being performed.
     * @param tokenURI_ The string URI to the token metadata.
     * @param operationType_ The type of bridging operation.
     * @return A `bytes32` hash, computed using `keccak256` of the encoded parameters:
     *         keccak256(abi.encodePacked(token_,tokenId_,receiver_,txHash_,txNonce_,chainId_,tokenURI_,operationType_));
     */
    function getERC721SignHash(
        address token_,
        uint256 tokenId_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        uint256 chainId_,
        string calldata tokenURI_,
        ERC721BridgingType operationType_
    ) external pure returns (bytes32);
}
