// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {INativeHandler} from "../interfaces/handlers/INativeHandler.sol";

/**
 * @title NativeHandler
 */
abstract contract NativeHandler is INativeHandler {
    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;

    receive() external payable {}

    /**
     * @inheritdoc INativeHandler
     */
    function depositNative(
        string calldata receiver_,
        string calldata network_
    ) external payable override {
        require(msg.value > 0, "NativeHandler: zero value");

        emit DepositedNative(msg.value, receiver_, network_);
    }

    function _withdrawNative(uint256 amount_, address receiver_) internal {
        require(amount_ > 0, "NativeHandler: amount is zero");
        require(receiver_ != address(0), "NativeHandler: receiver is zero");

        (bool sent_, ) = payable(receiver_).call{value: amount_}("");

        require(sent_, "NativeHandler: can't send eth");
    }

    /**
     * @inheritdoc INativeHandler
     */
    function getNativeSignHash(
        uint256 amount_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        uint256 chainId_
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(amount_, receiver_, txHash_, txNonce_, chainId_));
    }
}
