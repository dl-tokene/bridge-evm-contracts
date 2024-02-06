// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title INativeHandler
 */
interface INativeHandler {
    /**
     * @notice event emits from depositNative function
     */
    event DepositedNative(uint256 amount, string receiver, string network);

    /**
     * @notice function for depositing native currency, emits event DepositedNative
     * @param receiver_ the receiver address in destination network, information field for event
     * @param network_ the network name of destination network, information field for event
     */
    function depositNative(string calldata receiver_, string calldata network_) external payable;

    /**
     * @notice function for getting sign hash
     * @param amount_ the amount of withdrawn native currency
     * @param receiver_ the receiver address in destination network
     * @param txHash_ the hash of deposit tranaction
     * @param txNonce_ the nonce of deposit transaction
     * @param chainId_ the id of chain
     * @return bytes32 keccak256(abi.encodePacked(amount_,receiver_,txHash_,txNonce_,chainId_));
     */
    function getNativeSignHash(
        uint256 amount_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        uint256 chainId_
    ) external pure returns (bytes32);
}
