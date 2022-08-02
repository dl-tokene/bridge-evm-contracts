// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../interfaces/bridge/IBridge.sol";

import "../handlers/ERC20Handler.sol";
import "../handlers/ERC721Handler.sol";
import "../handlers/ERC1155Handler.sol";
import "../handlers/NativeHandler.sol";

import "../utils/Signers.sol";
import "../utils/Hashes.sol";

contract Bridge is
    IBridge,
    Signers,
    Hashes,
    ERC20Handler,
    ERC721Handler,
    ERC1155Handler,
    NativeHandler
{
    function __Bridge_init(address[] calldata signers_) external initializer {
        __Signers_init(signers_);
    }

    function withdrawERC20(
        address token_,
        uint256 amount_,
        bytes32 txHash_,
        uint256 txNonce_,
        bool isWrapped_,
        bytes[] calldata signatures_
    ) external override {
        bytes32 signHash_ = getERC20SignHash(
            token_,
            amount_,
            msg.sender,
            txHash_,
            txNonce_,
            block.chainid,
            isWrapped_
        );

        _checkAndUpdateHashes(txHash_, txNonce_);
        _checkSignatures(signHash_, signatures_);

        _withdrawERC20(token_, amount_, msg.sender, isWrapped_);
    }

    function withdrawERC721(
        address token_,
        uint256 tokenId_,
        bytes32 txHash_,
        uint256 txNonce_,
        bool isWrapped_,
        bytes[] calldata signatures_
    ) external override {
        bytes32 signHash_ = getERC721SignHash(
            token_,
            tokenId_,
            msg.sender,
            txHash_,
            txNonce_,
            block.chainid,
            isWrapped_
        );

        _checkAndUpdateHashes(txHash_, txNonce_);
        _checkSignatures(signHash_, signatures_);

        _withdrawERC721(token_, tokenId_, msg.sender, isWrapped_);
    }

    function withdrawERC1155(
        address token_,
        uint256 tokenId_,
        uint256 amount_,
        bytes32 txHash_,
        uint256 txNonce_,
        bool isWrapped_,
        bytes[] calldata signatures_
    ) external override {
        bytes32 signHash_ = getERC1155SignHash(
            token_,
            tokenId_,
            amount_,
            msg.sender,
            txHash_,
            txNonce_,
            block.chainid,
            isWrapped_
        );

        _checkAndUpdateHashes(txHash_, txNonce_);
        _checkSignatures(signHash_, signatures_);

        _withdrawERC1155(token_, tokenId_, amount_, msg.sender, isWrapped_);
    }

    function withdrawNative(
        uint256 amount_,
        bytes32 txHash_,
        uint256 txNonce_,
        bool isWrapped,
        bytes[] calldata signatures_
    ) external override {
        // TODO
    }
}
