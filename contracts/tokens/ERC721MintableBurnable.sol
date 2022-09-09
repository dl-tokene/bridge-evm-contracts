// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "../interfaces/tokens/IERC721MintableBurnable.sol";

contract ERC721MintableBurnable is IERC721MintableBurnable, Ownable, ERC721 {
    constructor(
        string memory name_,
        string memory symbol_,
        address owner_
    ) ERC721(name_, symbol_) {
        transferOwnership(owner_);
    }

    function mintTo(address receiver_, uint256 tokenId_) external override onlyOwner {
        _mint(receiver_, tokenId_);
    }

    function burnFrom(address payer_, uint256 tokenId_) external override onlyOwner {
        require(
            ownerOf(tokenId_) == payer_ &&
                (getApproved(tokenId_) == msg.sender || isApprovedForAll(payer_, msg.sender)),
            "ERC721MintableBurnable: not approved"
        );

        _burn(tokenId_);
    }
}
