// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import "../interfaces/tokens/IERC721MintableBurnable.sol";

contract ERC721MintableBurnable is IERC721MintableBurnable, Ownable, ERC721URIStorage {
    string public baseUri = "";

    constructor(
        string memory name_,
        string memory symbol_,
        address owner_,
        string memory baseURI_
    ) ERC721(name_, symbol_) {
        transferOwnership(owner_);

        baseUri = baseURI_;
    }

    function mintTo(
        address receiver_,
        uint256 tokenId_,
        string calldata tokenURI_
    ) external override onlyOwner {
        _safeMint(receiver_, tokenId_);

        if (bytes(tokenURI_).length > 0) {
            _setTokenURI(tokenId_, tokenURI_);
        }
    }

    function burnFrom(address payer_, uint256 tokenId_) external override onlyOwner {
        require(
            ownerOf(tokenId_) == payer_ &&
                (getApproved(tokenId_) == msg.sender || isApprovedForAll(payer_, msg.sender)),
            "ERC721MintableBurnable: not approved"
        );

        _burn(tokenId_);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseUri;
    }
}
