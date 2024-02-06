// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Hashes} from "../../utils/Hashes.sol";

contract HashesMock is Hashes {
    function checkAndUpdateHashes(bytes32 txHash_, uint256 txNonce_) external {
        _checkAndUpdateHashes(txHash_, txNonce_);
    }
}
