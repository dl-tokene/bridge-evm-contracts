// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

import {IERC1155Handler} from "../interfaces/handlers/IERC1155Handler.sol";
import {IERC1155MintableBurnable} from "../interfaces/tokens/IERC1155MintableBurnable.sol";

/**
 * @title ERC1155Handler
 */
abstract contract ERC1155Handler is IERC1155Handler, ERC1155Holder {
    /**
     * @inheritdoc IERC1155Handler
     */
    function depositERC1155(
        address token_,
        uint256 tokenId_,
        uint256 amount_,
        string calldata receiver_,
        string calldata network_,
        ERC1155BridgingType operationType_
    ) external override {
        require(token_ != address(0), "ERC1155Handler: zero token");
        require(amount_ > 0, "ERC1155Handler: amount is zero");

        IERC1155MintableBurnable erc1155_ = IERC1155MintableBurnable(token_);

        if (operationType_ == ERC1155BridgingType.Wrapped) {
            erc1155_.burnFrom(msg.sender, tokenId_, amount_);
        } else {
            erc1155_.safeTransferFrom(msg.sender, address(this), tokenId_, amount_, "");
        }

        emit DepositedERC1155(token_, tokenId_, amount_, receiver_, network_, operationType_);
    }

    function _withdrawERC1155(
        address token_,
        uint256 tokenId_,
        uint256 amount_,
        address receiver_,
        string calldata tokenURI_,
        ERC1155BridgingType operationType_
    ) internal {
        require(token_ != address(0), "ERC1155Handler: zero token");
        require(receiver_ != address(0), "ERC1155Handler: zero receiver");
        require(amount_ > 0, "ERC1155Handler: amount is zero");

        IERC1155MintableBurnable erc1155_ = IERC1155MintableBurnable(token_);

        if (operationType_ == ERC1155BridgingType.Wrapped) {
            erc1155_.mintTo(receiver_, tokenId_, amount_, tokenURI_);
        } else {
            erc1155_.safeTransferFrom(address(this), receiver_, tokenId_, amount_, "");
        }
    }

    /**
     * @inheritdoc IERC1155Handler
     */
    function getERC1155SignHash(
        address token_,
        uint256 tokenId_,
        uint256 amount_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        uint256 chainId_,
        string calldata tokenURI_,
        ERC1155BridgingType operationType_
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    token_,
                    tokenId_,
                    amount_,
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
