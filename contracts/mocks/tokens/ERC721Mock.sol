// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../../interfaces/tokens/IERC721MintableBurnable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ERC721Mock is IERC721MintableBurnable, ERC721 {
    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    function mintTo(address receiver_, uint256 tokenId_) external {
        _mint(receiver_, tokenId_);
    }

    function burn(uint256 tokenId_) external {
        _burn(tokenId_);
    }
}
