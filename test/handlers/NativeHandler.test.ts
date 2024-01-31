import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { wei } from "@scripts";

import { Reverter } from "@test-helpers";

import { NativeHandlerMock } from "@ethers-v6";

describe("NativeHandler", () => {
  const reverter = new Reverter();

  const baseAmount = wei("10");

  let OWNER: SignerWithAddress;

  let handler: NativeHandlerMock;

  before("setup", async () => {
    [OWNER] = await ethers.getSigners();

    const NativeHandlerMock = await ethers.getContractFactory("NativeHandlerMock");
    handler = await NativeHandlerMock.deploy();

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("depositNative", () => {
    it("should deposit native", async () => {
      await handler.depositNative("receiver", "kovan", {
        value: baseAmount,
      });

      expect(await ethers.provider.getBalance(await handler.getAddress())).to.equal(baseAmount);

      const depositEvent = (await handler.queryFilter(handler.filters.DepositedNative, -1))[0];

      expect(depositEvent.eventName).to.be.equal("DepositedNative");
      expect(depositEvent.args.amount).to.be.equal(baseAmount);
      expect(depositEvent.args.receiver).to.be.equal("receiver");
      expect(depositEvent.args.network).to.be.equal("kovan");
    });

    it("should revert when try deposit 0 tokens", async () => {
      await expect(handler.depositNative("receiver", "kovan", { value: 0 })).to.be.revertedWith(
        "NativeHandler: zero value",
      );
    });
  });

  describe("getNativeSignHash", () => {
    it("should encode args", async () => {
      let expectedTxHash = "0xc4f46c912cc2a1f30891552ac72871ab0f0e977886852bdd5dccd221a595647d";
      let expectedNonce = "1794147";
      let expectedChainId = 31378;

      let signHash0 = await handler.getNativeSignHash(
        baseAmount,
        OWNER,
        expectedTxHash,
        expectedNonce,
        expectedChainId,
      );

      expect(signHash0).to.be.equal(
        ethers.keccak256(
          ethers.solidityPacked(
            ["uint256", "address", "bytes32", "uint256", "uint256"],
            [baseAmount, OWNER.address, expectedTxHash, expectedNonce, expectedChainId],
          ),
        ),
      );

      let signHash1 = await handler.getNativeSignHash(wei("1"), OWNER, expectedTxHash, expectedNonce, expectedChainId);

      expect(signHash1).to.be.equal(
        ethers.keccak256(
          ethers.solidityPacked(
            ["uint256", "address", "bytes32", "uint256", "uint256"],
            [wei("1"), OWNER.address, expectedTxHash, expectedNonce, expectedChainId],
          ),
        ),
      );

      expect(signHash0).to.not.be.equal(signHash1);
    });
  });

  describe("withdrawNative", () => {
    it("should withdraw native", async () => {
      await handler.depositNative("receiver", "kovan", { value: baseAmount });
      await handler.withdrawNative(baseAmount, OWNER);

      expect(await ethers.provider.getBalance(await handler.getAddress())).to.equal(0);
    });

    it("should revert when amount is 0", async () => {
      await expect(handler.withdrawNative(0, OWNER)).to.be.revertedWith("NativeHandler: amount is zero");
    });

    it("should revert when receiver address is 0", async () => {
      await expect(handler.withdrawNative(baseAmount, ethers.ZeroAddress)).to.be.revertedWith(
        "NativeHandler: receiver is zero",
      );
    });

    it("should revert when amount more than balance", async () => {
      await expect(handler.withdrawNative(wei("1000000"), OWNER)).to.be.revertedWith("NativeHandler: can't send eth");
    });
  });
});
