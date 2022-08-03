// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../../utils/Signers.sol";

contract SignersMock is Signers {
    function checkSignatures(bytes32 signHash_, bytes[] calldata signatures_) external view {
        _checkSignatures(signHash_, signatures_);
    }
}
