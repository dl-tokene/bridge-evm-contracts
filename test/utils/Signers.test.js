const { assert } = require("chai");
const { toBN, accounts, wei } = require("../../scripts/helpers/utils");
const truffleAssert = require("truffle-assertions");
const { artifacts, web3 } = require("hardhat");

const Signers = artifacts.require("SignersMock");

Signers.numberFormat = "BigNumber";

describe("Signers", () => {});
