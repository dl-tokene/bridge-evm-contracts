// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Signers} from "../../utils/Signers.sol";

contract SignersMock is Signers {
    function __SignersMock_init(
        address[] calldata signers_,
        uint256 signaturesThreshold_
    ) public initializer {
        __Signers_init(signers_, signaturesThreshold_);
    }

    function checkSignatures(bytes32 signHash_, bytes[] calldata signatures_) external view {
        _checkSignatures(signHash_, signatures_);
    }
}
