// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../interfaces/handlers/INativeHandler.sol";

abstract contract NativeHandler is INativeHandler {
    function depositNative(string calldata receiver_, string calldata network_)
        external
        payable
        override
    {
        require(msg.value > 0, "NativeHandler: zero value");

        emit DepositedNative(msg.value, receiver_, network_);
    }

    function _withdrawNative(uint256 amount_, address receiver_) internal {
        require(amount_ > 0, "NativeHandler: amount is zero");

        (bool sent_, bytes memory data_) = payable(receiver_).call{value: amount_}("");

        require(sent_, "NativeHandler: can't send eth");
    }

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
