// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../../interfaces/tokens/IERC1155MintableBurnable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract ERC1155Mock is IERC1155MintableBurnable, ERC1155 {
    constructor(string memory uri_) ERC1155(uri_) {}

    function mintTo(
        address receiver_,
        uint256 tokenId_,
        uint256 amount_
    ) external {
        _mint(receiver_, tokenId_, amount_, "");
    }

    function burn(
        address payer_,
        uint256 tokenId_,
        uint256 amount_
    ) external {
        _burn(payer_, tokenId_, amount_);
    }
}
