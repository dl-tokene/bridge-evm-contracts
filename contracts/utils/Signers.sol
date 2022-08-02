// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

abstract contract Signers is OwnableUpgradeable {
    using ECDSA for bytes32;
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 public signaturesThreshold;

    EnumerableSet.AddressSet internal _signers;

    function __Signers_init(address[] calldata signers_, uint256 signaturesThreshold_)
        public
        onlyInitializing
    {
        __Ownable_init();

        addSigners(signers_);
        setSignaturesThreshold(signaturesThreshold_);
    }

    function _checkCorrectSigners(address[] memory signers_) private view {
        for (uint256 i = 0; i < signers_.length; i++) {
            for (uint256 j = i + 1; j < signers_.length; j++) {
                require(signers_[i] != signers_[j], "Signers: duplicate signers");
            }

            require(_signers.contains(signers_[i]), "Signers: invalid signer");
        }

        require(signers_.length >= signaturesThreshold, "Signers: threshold is not met");
    }

    function _checkSignatures(bytes32 signHash_, bytes[] calldata signatures_) internal view {
        address[] memory signers_ = new address[](signatures_.length);

        for (uint256 i = 0; i < signatures_.length; i++) {
            signers_[i] = signHash_.toEthSignedMessageHash().recover(signatures_[i]);
        }

        _checkCorrectSigners(signers_);
    }

    function setSignaturesThreshold(uint256 signaturesThreshold_) public onlyOwner {
        require(
            signaturesThreshold_ > 0 && signaturesThreshold_ <= _signers.length(),
            "Signers: invalid threshold"
        );

        signaturesThreshold = signaturesThreshold_;
    }

    function addSigners(address[] calldata signers_) public onlyOwner {
        for (uint256 i = 0; i < signers_.length; i++) {
            require(signers_[i] != address(0), "Signers: zero signer");

            _signers.add(signers_[i]);
        }
    }

    function removeSigners(address[] calldata signers_) public onlyOwner {
        for (uint256 i = 0; i < signers_.length; i++) {
            _signers.remove(signers_[i]);
        }
    }

    function getSigners() external view returns (address[] memory) {
        return _signers.values();
    }
}
