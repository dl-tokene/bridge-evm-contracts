// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IUSDCType} from "../../interfaces/tokens/IUSDCType.sol";

contract USDCTokenType is IERC20, IUSDCType, ERC20 {
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

    function mint(address receiver_, uint256 amount_) external {
        _mint(receiver_, amount_);
    }

    function burn(uint256 amount_) external override {
        _burn(msg.sender, amount_);
    }
}
