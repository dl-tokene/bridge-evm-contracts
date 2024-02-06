// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

import "../interfaces/bridge/IBridge.sol";

import "../handlers/ERC20Handler.sol";
import "../handlers/ERC721Handler.sol";
import "../handlers/ERC1155Handler.sol";
import "../handlers/NativeHandler.sol";

import "../utils/Signers.sol";
import "../utils/Hashes.sol";

contract Bridge is
    IBridge,
    UUPSUpgradeable,
    Signers,
    Hashes,
    ERC20Handler,
    ERC721Handler,
    ERC1155Handler,
    NativeHandler
{
    function __Bridge_init(
        address[] calldata signers_,
        uint256 signaturesThreshold_
    ) external initializer {
        __Signers_init(signers_, signaturesThreshold_);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function withdrawERC20(
        address token_,
        uint256 amount_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        bool isWrapped_,
        bytes[] calldata signatures_
    ) external override {
        bytes32 signHash_ = getERC20SignHash(
            token_,
            amount_,
            receiver_,
            txHash_,
            txNonce_,
            block.chainid,
            isWrapped_
        );

        _checkAndUpdateHashes(txHash_, txNonce_);
        _checkSignatures(signHash_, signatures_);

        _withdrawERC20(token_, amount_, receiver_, isWrapped_);
    }

    function withdrawERC721(
        address token_,
        uint256 tokenId_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        string calldata tokenURI_,
        bool isWrapped_,
        bytes[] calldata signatures_
    ) external override {
        bytes32 signHash_ = getERC721SignHash(
            token_,
            tokenId_,
            receiver_,
            txHash_,
            txNonce_,
            block.chainid,
            tokenURI_,
            isWrapped_
        );

        _checkAndUpdateHashes(txHash_, txNonce_);
        _checkSignatures(signHash_, signatures_);

        _withdrawERC721(token_, tokenId_, receiver_, tokenURI_, isWrapped_);
    }

    function withdrawERC1155(
        address token_,
        uint256 tokenId_,
        uint256 amount_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        string calldata tokenURI_,
        bool isWrapped_,
        bytes[] calldata signatures_
    ) external override {
        bytes32 signHash_ = getERC1155SignHash(
            token_,
            tokenId_,
            amount_,
            receiver_,
            txHash_,
            txNonce_,
            block.chainid,
            tokenURI_,
            isWrapped_
        );

        _checkAndUpdateHashes(txHash_, txNonce_);
        _checkSignatures(signHash_, signatures_);

        _withdrawERC1155(token_, tokenId_, amount_, receiver_, tokenURI_, isWrapped_);
    }

    function withdrawNative(
        uint256 amount_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        bytes[] calldata signatures_
    ) external override {
        bytes32 signHash_ = getNativeSignHash(
            amount_,
            receiver_,
            txHash_,
            txNonce_,
            block.chainid
        );

        _checkAndUpdateHashes(txHash_, txNonce_);
        _checkSignatures(signHash_, signatures_);

        _withdrawNative(amount_, receiver_);
    }

    function addHash(bytes32 txHash_, uint256 txNonce_) external onlyOwner {
        _checkAndUpdateHashes(txHash_, txNonce_);
    }
}
