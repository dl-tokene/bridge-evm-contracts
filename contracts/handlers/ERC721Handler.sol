// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

import {IERC721Handler} from "../interfaces/handlers/IERC721Handler.sol";
import {IERC721MintableBurnable} from "../interfaces/tokens/IERC721MintableBurnable.sol";

/**
 * @title ERC721Handler
 */
abstract contract ERC721Handler is IERC721Handler, ERC721Holder {
    /**
     * @inheritdoc IERC721Handler
     */
    function depositERC721(
        address token_,
        uint256 tokenId_,
        string calldata receiver_,
        string calldata network_,
        ERC721BridgingType operationType_
    ) external override {
        require(token_ != address(0), "ERC721Handler: zero token");

        IERC721MintableBurnable erc721_ = IERC721MintableBurnable(token_);

        if (operationType_ == ERC721BridgingType.Wrapped) {
            erc721_.burnFrom(msg.sender, tokenId_);
        } else {
            erc721_.safeTransferFrom(msg.sender, address(this), tokenId_);
        }

        emit DepositedERC721(token_, tokenId_, receiver_, network_, operationType_);
    }

    function _withdrawERC721(
        address token_,
        uint256 tokenId_,
        address receiver_,
        string calldata tokenURI_,
        ERC721BridgingType operationType_
    ) internal {
        require(token_ != address(0), "ERC721Handler: zero token");
        require(receiver_ != address(0), "ERC721Handler: zero receiver");

        IERC721MintableBurnable erc721_ = IERC721MintableBurnable(token_);

        if (operationType_ == ERC721BridgingType.Wrapped) {
            erc721_.mintTo(receiver_, tokenId_, tokenURI_);
        } else {
            erc721_.safeTransferFrom(address(this), receiver_, tokenId_);
        }
    }

    /**
     * @inheritdoc IERC721Handler
     */
    function getERC721SignHash(
        address token_,
        uint256 tokenId_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        uint256 chainId_,
        string calldata tokenURI_,
        ERC721BridgingType operationType_
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    token_,
                    tokenId_,
                    receiver_,
                    txHash_,
                    txNonce_,
                    chainId_,
                    tokenURI_,
                    operationType_
                )
            );
    }
}
