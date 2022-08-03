const { assert } = require("chai");
const { toBN, accounts, wei } = require("../../scripts/helpers/utils");
const truffleAssert = require("truffle-assertions");
const { artifacts, web3 } = require("hardhat");

const NativeHandlerMock = artifacts.require("NativeHandlerMock");

NativeHandlerMock.numberFormat = "BigNumber";

describe("NativeHandler", () => {
  const baseAmount = wei("10");

  let OWNER;
  let handler;
  let token;

  before("setup", async () => {
    OWNER = await accounts(0);
  });

  beforeEach("setup", async () => {
    handler = await NativeHandlerMock.new();
  });

  describe("depositNative", () => {
    it("should deposit native", async () => {
      let tx = await handler.depositNative("receiver", "kovan", { value: baseAmount });

      assert.equal(await web3.eth.getBalance(handler.address), baseAmount);
      assert.equal(tx.receipt.logs[0].event, "DepositedNative");
      assert.equal(tx.receipt.logs[0].args.tokenAmount, baseAmount);
      assert.equal(tx.receipt.logs[0].args.receiver, "receiver");
      assert.equal(tx.receipt.logs[0].args.network, "kovan");
    });

    it("should revert when try deposit 0 tokens", async () => {
      await truffleAssert.reverts(handler.depositNative("receiver", "kovan"), "NativeHandler: zero value");
    });
  });

  describe("getNativeSignHash", () => {
    it("should encode args", async () => {
      let expectedTxHash = "0xc4f46c912cc2a1f30891552ac72871ab0f0e977886852bdd5dccd221a595647d";
      let expextedNonce = "1794147";
      let expectedChainId = 31378;

      let signHash0 = await handler.getNativeSignHash(
        baseAmount,
        OWNER,
        expectedTxHash,
        expextedNonce,
        expectedChainId
      );

      assert.equal(
        signHash0,
        web3.utils.soliditySha3(
          { value: baseAmount, type: "uint256" },
          { value: OWNER, type: "address" },
          { value: expectedTxHash, type: "bytes32" },
          { value: expextedNonce, type: "uint256" },
          { value: expectedChainId, type: "uint256" }
        )
      );

      expectedIsWraped = false;

      let signHash1 = await handler.getNativeSignHash(wei("1"), OWNER, expectedTxHash, expextedNonce, expectedChainId);

      assert.equal(
        signHash1,
        web3.utils.soliditySha3(
          { value: wei("1"), type: "uint256" },
          { value: OWNER, type: "address" },
          { value: expectedTxHash, type: "bytes32" },
          { value: expextedNonce, type: "uint256" },
          { value: expectedChainId, type: "uint256" }
        )
      );
      assert.notEqual(signHash0, signHash1);
    });
  });
});
