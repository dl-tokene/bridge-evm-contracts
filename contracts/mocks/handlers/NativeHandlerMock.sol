// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {NativeHandler} from "../../handlers/NativeHandler.sol";

contract NativeHandlerMock is NativeHandler {
    function withdrawNative(uint256 amount_, address receiver_) external {
        _withdrawNative(amount_, receiver_);
    }
}
