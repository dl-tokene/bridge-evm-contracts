// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../handlers/IERC20Handler.sol";
import "../handlers/IERC721Handler.sol";
import "../handlers/IERC1155Handler.sol";
import "../handlers/INativeHandler.sol";

interface IBridge is IERC20Handler, IERC721Handler, IERC1155Handler, INativeHandler {
    function withdrawERC20(
        address token_,
        uint256 amount_,
        bytes32 txHash_,
        uint256 txNonce_,
        bool isWrapped,
        bytes[] calldata signatures_
    ) external;

    function withdrawERC721(
        address token_,
        uint256 tokenId_,
        bytes32 txHash_,
        uint256 txNonce_,
        bool isWrapped,
        bytes[] calldata signatures_
    ) external;

    function withdrawERC1155(
        address token_,
        uint256 tokenId_,
        uint256 amount_,
        bytes32 txHash_,
        uint256 txNonce_,
        bool isWrapped_,
        bytes[] calldata signatures_
    ) external;

    function withdrawNative(
        uint256 amount_,
        bytes32 txHash_,
        uint256 txNonce_,
        bytes[] calldata signatures_
    ) external;
}
