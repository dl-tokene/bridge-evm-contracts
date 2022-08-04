// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../../interfaces/tokens/IERC20MintableBurnable.sol";

contract ERC20Mock is ERC20, IERC20MintableBurnable {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mintTo(address receiver_, uint256 amount_) external override {
        _mint(receiver_, amount_);
    }

    function burnFrom(address payer_, uint256 amount_) external override {
        _burn(payer_, amount_);
    }
}
