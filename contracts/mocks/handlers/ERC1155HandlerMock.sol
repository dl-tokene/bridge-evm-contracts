// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../../handlers/ERC1155Handler.sol";

contract ERC1155HandlerMock is ERC1155Handler {
    function withdrawERC1155(
        address token_,
        uint256 tokenId_,
        uint256 amount_,
        address receiver_,
        bool isWrapped_
    ) external {
        _withdrawERC1155(token_, tokenId_, amount_, receiver_, isWrapped_);
    }
}
