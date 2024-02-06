// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ERC1155Handler} from "../../handlers/ERC1155Handler.sol";

contract ERC1155HandlerMock is ERC1155Handler {
    function withdrawERC1155(
        address token_,
        uint256 tokenId_,
        uint256 amount_,
        address receiver_,
        string calldata tokenURI_,
        ERC1155BridgingType operationType_
    ) external {
        _withdrawERC1155(token_, tokenId_, amount_, receiver_, tokenURI_, operationType_);
    }
}
