// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

import "../interfaces/handlers/IERC1155Handler.sol";
import "../interfaces/tokens/IERC1155MintableBurnable.sol";

abstract contract ERC1155Handler is IERC1155Handler, ERC1155Holder {
    function depositERC1155(
        address token_,
        uint256 tokenId_,
        uint256 amount_,
        string calldata receiver_,
        string calldata network_,
        bool isWrapped_
    ) external override {
        require(token_ != address(0), "ERC1155Handler: zero token");
        require(amount_ > 0, "ERC1155Handler: amount is zero");

        IERC1155MintableBurnable erc1155_ = IERC1155MintableBurnable(token_);

        if (isWrapped_) {
            erc1155_.burn(msg.sender, tokenId_, amount_);
        } else {
            erc1155_.safeTransferFrom(msg.sender, address(this), tokenId_, amount_, "");
        }

        emit DepositedERC1155(token_, tokenId_, amount_, receiver_, network_, isWrapped_);
    }

    function _withdrawERC1155(
        address token_,
        uint256 tokenId_,
        uint256 amount_,
        address receiver_,
        bool isWrapped_
    ) internal {
        require(token_ != address(0), "ERC1155Handler: zero token");
        require(receiver_ != address(0), "ERC1155Handler: zero receiver");
        require(amount_ > 0, "ERC1155Handler: amount is zero");

        IERC1155MintableBurnable erc1155_ = IERC1155MintableBurnable(token_);

        if (isWrapped_) {
            erc1155_.mintTo(receiver_, tokenId_, amount_);
        } else {
            erc1155_.safeTransferFrom(address(this), receiver_, tokenId_, amount_, "");
        }
    }

    function getERC1155SignHash(
        address token_,
        uint256 tokenId_,
        uint256 amount_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        uint256 chainId_,
        bool isWrapped_
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
                    isWrapped_
                )
            );
    }
}
