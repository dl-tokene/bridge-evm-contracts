// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../../handlers/ERC20Handler.sol";

contract ERC20HandlerMock is ERC20Handler {
    function withdrawERC20(
        address token_,
        uint256 amount_,
        address receiver_,
        bool isWrapped_
    ) external {
        _withdrawERC20(token_, amount_, receiver_, isWrapped_);
    }
}
