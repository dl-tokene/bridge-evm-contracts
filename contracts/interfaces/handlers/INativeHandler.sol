// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface INativeHandler {
    event DepositedNative(uint256 tokenAmount, string receiver, string network);

    function depositNative(string calldata receiver_, string calldata network_) external payable;
}
