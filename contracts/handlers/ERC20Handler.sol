// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IUSDCType} from "../interfaces/tokens/IUSDCType.sol";
import {IERC20Handler} from "../interfaces/handlers/IERC20Handler.sol";
import {IERC20MintableBurnable} from "../interfaces/tokens/IERC20MintableBurnable.sol";

/**
 * @title ERC20Handler
 */
abstract contract ERC20Handler is IERC20Handler {
    using SafeERC20 for IERC20MintableBurnable;

    /**
     * @inheritdoc IERC20Handler
     */
    function depositERC20(
        address token_,
        uint256 amount_,
        string calldata receiver_,
        string calldata network_,
        ERC20BridgingType operationType_
    ) external override {
        require(token_ != address(0), "ERC20Handler: zero token");
        require(amount_ > 0, "ERC20Handler: amount is zero");

        IERC20MintableBurnable erc20_ = IERC20MintableBurnable(token_);

        if (operationType_ == ERC20BridgingType.Wrapped) {
            erc20_.burnFrom(msg.sender, amount_);
        } else {
            erc20_.safeTransferFrom(msg.sender, address(this), amount_);
        }

        if (operationType_ == ERC20BridgingType.USDCType) {
            IUSDCType(token_).burn(amount_);
        }

        emit DepositedERC20(token_, amount_, receiver_, network_, operationType_);
    }

    function _withdrawERC20(
        address token_,
        uint256 amount_,
        address receiver_,
        ERC20BridgingType operationType_
    ) internal {
        require(token_ != address(0), "ERC20Handler: zero token");
        require(amount_ > 0, "ERC20Handler: amount is zero");
        require(receiver_ != address(0), "ERC20Handler: zero receiver");

        IERC20MintableBurnable erc20_ = IERC20MintableBurnable(token_);

        if (operationType_ == ERC20BridgingType.Wrapped) {
            erc20_.mintTo(receiver_, amount_);
        } else if (operationType_ == ERC20BridgingType.USDCType) {
            IUSDCType(token_).mint(receiver_, amount_);
        } else {
            erc20_.safeTransfer(receiver_, amount_);
        }
    }

    /**
     * @inheritdoc IERC20Handler
     */
    function getERC20SignHash(
        address token_,
        uint256 amount_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        uint256 chainId_,
        ERC20BridgingType operationType_
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    token_,
                    amount_,
                    receiver_,
                    txHash_,
                    txNonce_,
                    chainId_,
                    operationType_
                )
            );
    }
}
