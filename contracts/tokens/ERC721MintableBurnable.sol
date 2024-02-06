// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {IERC721MintableBurnable} from "../interfaces/tokens/IERC721MintableBurnable.sol";

contract ERC721MintableBurnable is
    IERC721MintableBurnable,
    Ownable,
    ERC721Enumerable,
    ERC721URIStorage
{
    string public baseUri;

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

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721URIStorage, ERC721) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Enumerable, ERC721, IERC165) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721URIStorage, ERC721) {
        super._burn(tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721Enumerable, ERC721) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseUri;
    }
}
