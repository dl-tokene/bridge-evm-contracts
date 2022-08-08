// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IERC721Handler {
    /**
     * @notice event emits from depositERC721 function
     */
    event DepositedERC721(
        address token,
        uint256 tokenId,
        string receiver,
        string network,
        bool isWrapped
    );

    /**
     * @notice function for depositing erc721 tokens, emits event DepositedERC721
     * @param token_ the address of deposited token
     * @param tokenId_ the id of deposited token
     * @param receiver_ the receiver address in destination network, information field for event
     * @param network_ the network name of destination network, information field for event
     * @param isWrapped_ the boolean flag, if true - token will burned, false - token will transferred
     */
    function depositERC721(
        address token_,
        uint256 tokenId_,
        string calldata receiver_,
        string calldata network_,
        bool isWrapped_
    ) external;

    /**
     * @notice function for getting sign hash
     * @param token_ the address of withdrawn token
     * @param tokenId_ the id of deposited token
     * @param receiver_ the receiver address in destination network
     * @param txHash_ the hash of deposit tranaction
     * @param txNonce_ the nonce of deposit transaction
     * @param chainId_ the id of chain
     * @param isWrapped_ the boolean flag, if true - tokens will minted, false - tokens will transferred
     * @return bytes32 keccak256(abi.encodePacked(token_,tokenId_,receiver_,txHash_,txNonce_,chainId_,isWrapped_));
     */
    function getERC721SignHash(
        address token_,
        uint256 tokenId_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        uint256 chainId_,
        bool isWrapped_
    ) external pure returns (bytes32);
}
