// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import "../interfaces/tokens/IERC721MintableBurnable.sol";

contract ERC721MintableBurnable is IERC721MintableBurnable, Ownable, ERC721URIStorage {
    string private _uri = "";

    constructor(
        string memory name_,
        string memory symbol_,
        address owner_,
        string memory baseURI_
    ) ERC721(name_, symbol_) {
        transferOwnership(owner_);
        _uri = baseURI_;
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

    function burn(uint256 tokenId_) external override onlyOwner {
        _burn(tokenId_);
    }

    function _baseURI() internal view override returns (string memory) {
        return _uri;
    }
}
