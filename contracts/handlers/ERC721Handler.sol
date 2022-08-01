// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../interfaces/handlers/IERC721Handler.sol";
import "../interfaces/tokens/IERC721MintableBurnable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

abstract contract ERC721Handler is IERC721Handler, IERC721Receiver {
    function depositERC721(
        address token_,
        uint256 tokenId_,
        string calldata receiver_,
        string calldata network_,
        bool isWrapped_
    ) external override {
        require(token_ != address(0), "ERC721Handler: zero token");

        IERC721MintableBurnable erc721_ = IERC721MintableBurnable(token_);

        if (isWrapped_) {
            erc721_.burn(tokenId_);
        } else {
            erc721_.safeTransferFrom(msg.sender, address(this), tokenId_);
        }

        emit DepositedERC721(token_, tokenId_, receiver_, network_, isWrapped_);
    }

    function _withdrawERC721(
        address token_,
        uint256 tokenId_,
        address receiver_,
        bool isWrapped_
    ) internal {
        require(token_ != address(0), "ERC721Handler: zero token");
        require(receiver_ != address(0), "ERC721Handler: zero receiver");

        IERC721MintableBurnable erc721_ = IERC721MintableBurnable(token_);

        if (isWrapped_) {
            erc721_.mintTo(receiver_, tokenId_);
        } else {
            erc721_.safeTransferFrom(address(this), receiver_, tokenId_);
        }
    }

    function getERC721SignHash(
        address token_,
        uint256 tokenId_,
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
                    receiver_,
                    txHash_,
                    txNonce_,
                    chainId_,
                    isWrapped_
                )
            );
    }
}
