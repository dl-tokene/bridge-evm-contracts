// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ERC721Handler} from "../../handlers/ERC721Handler.sol";

contract ERC721HandlerMock is ERC721Handler {
    function withdrawERC721(
        address token_,
        uint256 tokenId_,
        address receiver_,
        string calldata tokenURI_,
        ERC721BridgingType operationType_
    ) external {
        _withdrawERC721(token_, tokenId_, receiver_, tokenURI_, operationType_);
    }
}
