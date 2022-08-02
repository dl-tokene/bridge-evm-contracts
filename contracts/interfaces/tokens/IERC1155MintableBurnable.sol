// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IERC1155MintableBurnable is IERC1155 {
    function mintTo(
        address receiver_,
        uint256 tokenId_,
        uint256 amount_
    ) external;

    function burn(
        address payer_,
        uint256 tokenId_,
        uint256 amount_
    ) external;
}
