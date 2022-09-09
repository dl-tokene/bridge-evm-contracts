// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "../interfaces/tokens/IERC1155MintableBurnable.sol";

contract ERC1155MintableBurnable is IERC1155MintableBurnable, Ownable, ERC1155 {
    constructor(string memory uri_, address owner_) ERC1155(uri_) {
        transferOwnership(owner_);
    }

    function mintTo(
        address receiver_,
        uint256 tokenId_,
        uint256 amount_
    ) external override onlyOwner {
        _mint(receiver_, tokenId_, amount_, "");
    }

    function burnFrom(
        address payer_,
        uint256 tokenId_,
        uint256 amount_
    ) external override onlyOwner {
        require(isApprovedForAll(payer_, msg.sender), "ERC1155MintableBurnable: not approved");

        _burn(payer_, tokenId_, amount_);
    }
}
