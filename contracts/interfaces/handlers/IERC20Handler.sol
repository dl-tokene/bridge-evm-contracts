// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title IERC20Handler
 */
interface IERC20Handler {
    /**
     * @dev Enumerates the types of ERC20 token bridging options.
     */
    enum ERC20BridgingType {
        LiquidityPool,
        Wrapped,
        USDCType
    }

    /**
     * @dev Emitted when ERC20 tokens are deposited for bridging.
     * @param token The address of the ERC20 token being bridged.
     * @param amount The amount of tokens deposited for bridging.
     * @param receiver The receiver's address in the destination network.
     * @param network The name of the destination network.
     * @param operationType The type of bridging operation performed.
     */
    event DepositedERC20(
        address token,
        uint256 amount,
        string receiver,
        string network,
        ERC20BridgingType operationType
    );

    /**
     * @notice Deposits ERC20 tokens for bridging, emitting a `DepositedERC20` event.
     * @param token_ The address of the deposited token.
     * @param amount_ The amount of deposited tokens.
     * @param receiver_ The receiver's address in the destination network, used as an informational field for the event.
     * @param network_ The name of the destination network, used as an informational field for the event.
     * @param operationType_ The type of bridging operation being performed.
     */
    function depositERC20(
        address token_,
        uint256 amount_,
        string calldata receiver_,
        string calldata network_,
        ERC20BridgingType operationType_
    ) external;

    /**
     * @notice Generates a hash for signing, related to a specific ERC20 bridging operation.
     * @param token_ The address of the token being withdrawn.
     * @param amount_ The amount of tokens being withdrawn.
     * @param receiver_ The receiver's address in the destination network.
     * @param txHash_ The hash of the deposit transaction.
     * @param txNonce_ The nonce of the deposit transaction.
     * @param chainId_ The ID of the chain where the operation is being performed.
     * @param operationType_ The type of bridging operation.
     * @return A `bytes32` hash, computed using keccak256 of the encoded parameters:
     *         keccak256(abi.encodePacked(token_,amount_,receiver_,txHash_,txNonce_,chainId_,operationType_));
     */
    function getERC20SignHash(
        address token_,
        uint256 amount_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        uint256 chainId_,
        ERC20BridgingType operationType_
    ) external pure returns (bytes32);
}
