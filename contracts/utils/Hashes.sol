// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

abstract contract Hashes {
    mapping(bytes32 => bool) public usedHashes; // keccak256(txHash . txNonce) => is used

    function containsHash(bytes32 txHash_, uint256 txNonce_) external view returns (bool) {
        bytes32 nonceHash_ = keccak256(abi.encodePacked(txHash_, txNonce_));

        return usedHashes[nonceHash_];
    }

    function _checkAndUpdateHashes(bytes32 txHash_, uint256 txNonce_) internal {
        bytes32 nonceHash_ = keccak256(abi.encodePacked(txHash_, txNonce_));

        require(!usedHashes[nonceHash_], "Hashes: the hash nonce is used");

        usedHashes[nonceHash_] = true;
    }
}
