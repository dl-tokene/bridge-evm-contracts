// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";

import "../interfaces/tokens/IERC1155MintableBurnable.sol";

contract ERC1155MintableBurnable is
    IERC1155MintableBurnable,
    Ownable,
    ERC1155Supply,
    ERC1155URIStorage
{
    string public name;
    string public symbol;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory uri_,
        address owner_
    ) ERC1155(uri_) {
        name = name_;
        symbol = symbol_;

        _setBaseURI(uri_);
        transferOwnership(owner_);
    }

    function mintTo(
        address receiver_,
        uint256 tokenId_,
        uint256 amount_,
        string calldata tokenURI_
    ) external override onlyOwner {
        _mint(receiver_, tokenId_, amount_, "");

        if (bytes(tokenURI_).length > 0) {
            _setURI(tokenId_, tokenURI_);
        }
    }

    function burnFrom(
        address payer_,
        uint256 tokenId_,
        uint256 amount_
    ) external override onlyOwner {
        require(isApprovedForAll(payer_, msg.sender), "ERC1155MintableBurnable: not approved");

        _burn(payer_, tokenId_, amount_);
    }

    function uri(
        uint256 tokenId
    ) public view override(ERC1155URIStorage, ERC1155) returns (string memory) {
        return super.uri(tokenId);
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155Supply, ERC1155) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
