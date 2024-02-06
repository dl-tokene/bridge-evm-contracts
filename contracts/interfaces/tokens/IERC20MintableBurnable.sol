// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC20MintableBurnable is IERC20 {
    function mintTo(address receiver_, uint256 amount_) external;

    function burnFrom(address payer_, uint256 amount_) external;
}
