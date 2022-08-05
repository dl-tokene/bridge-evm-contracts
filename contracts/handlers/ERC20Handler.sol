// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/tokens/IERC20MintableBurnable.sol";
import "../interfaces/handlers/IERC20Handler.sol";

abstract contract ERC20Handler is IERC20Handler {
    using SafeERC20 for IERC20MintableBurnable;

    function depositERC20(
        address token_,
        uint256 amount_,
        string calldata receiver_,
        string calldata network_,
        bool isWrapped_
    ) external override {
        require(token_ != address(0), "ERC20Handler: zero token");
        require(amount_ > 0, "ERC20Handler: amount is zero");

        IERC20MintableBurnable erc20_ = IERC20MintableBurnable(token_);

        if (isWrapped_) {
            erc20_.burnFrom(msg.sender, amount_);
        } else {
            erc20_.safeTransferFrom(msg.sender, address(this), amount_);
        }

        emit DepositedERC20(token_, amount_, receiver_, network_, isWrapped_);
    }

    function _withdrawERC20(
        address token_,
        uint256 amount_,
        address receiver_,
        bool isWrapped_
    ) internal {
        require(token_ != address(0), "ERC20Handler: zero token");
        require(amount_ > 0, "ERC20Handler: amount is zero");
        require(receiver_ != address(0), "ERC20Handler: zero receiver");

        IERC20MintableBurnable erc20_ = IERC20MintableBurnable(token_);

        if (isWrapped_) {
            erc20_.mintTo(receiver_, amount_);
        } else {
            erc20_.safeTransfer(receiver_, amount_);
        }
    }

    function getERC20SignHash(
        address token_,
        uint256 amount_,
        address receiver_,
        bytes32 txHash_,
        uint256 txNonce_,
        uint256 chainId_,
        bool isWrapped_
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
                    isWrapped_
                )
            );
    }
}
