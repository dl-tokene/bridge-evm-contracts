// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

import {IBridge} from "../interfaces/bridge/IBridge.sol";

import {ERC20Handler} from "../handlers/ERC20Handler.sol";
import {ERC721Handler} from "../handlers/ERC721Handler.sol";
import {ERC1155Handler} from "../handlers/ERC1155Handler.sol";
import {NativeHandler} from "../handlers/NativeHandler.sol";

import {Signers} from "../utils/Signers.sol";
import {Hashes} from "../utils/Hashes.sol";

/**
 * @title Bridge Contract
 */
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

    /**
     * @inheritdoc UUPSUpgradeable
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @inheritdoc IBridge
     */
    function withdrawERC20(
        address token_,
        uint256 amount_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        ERC20BridgingType operationType_,
        bytes[] calldata signatures_
    ) external override {
        bytes32 signHash_ = getERC20SignHash(
            token_,
            amount_,
            receiver_,
            txHash_,
            txNonce_,
            block.chainid,
            operationType_
        );

        _checkAndUpdateHashes(txHash_, txNonce_);
        _checkSignatures(signHash_, signatures_);

        _withdrawERC20(token_, amount_, receiver_, operationType_);
    }

    /**
     * @inheritdoc IBridge
     */
    function withdrawERC721(
        address token_,
        uint256 tokenId_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        string calldata tokenURI_,
        ERC721BridgingType operationType_,
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
            operationType_
        );

        _checkAndUpdateHashes(txHash_, txNonce_);
        _checkSignatures(signHash_, signatures_);

        _withdrawERC721(token_, tokenId_, receiver_, tokenURI_, operationType_);
    }

    /**
     * @inheritdoc IBridge
     */
    function withdrawERC1155(
        address token_,
        uint256 tokenId_,
        uint256 amount_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        string calldata tokenURI_,
        ERC1155BridgingType operationType_,
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
            operationType_
        );

        _checkAndUpdateHashes(txHash_, txNonce_);
        _checkSignatures(signHash_, signatures_);

        _withdrawERC1155(token_, tokenId_, amount_, receiver_, tokenURI_, operationType_);
    }

    /**
     * @inheritdoc IBridge
     */
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

    /**
     * @notice The function to add a new hash
     */
    function addHash(bytes32 txHash_, uint256 txNonce_) external onlyOwner {
        _checkAndUpdateHashes(txHash_, txNonce_);
    }
}
