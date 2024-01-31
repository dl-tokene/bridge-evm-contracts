import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { wei } from "@scripts";

import { Reverter } from "@test-helpers";

import { ERC20HandlerMock, ERC20MintableBurnable } from "@ethers-v6";

describe("ERC20Handler", () => {
  const reverter = new Reverter();

  const baseBalance = wei("1000000");

  let OWNER: SignerWithAddress;

  let token: ERC20MintableBurnable;
  let handler: ERC20HandlerMock;

  before("setup", async () => {
    [OWNER] = await ethers.getSigners();

    const ERC20MB = await ethers.getContractFactory("ERC20MintableBurnable");
    token = await ERC20MB.deploy("Mock", "MK", OWNER.address);

    const ERC20HandlerMock = await ethers.getContractFactory("ERC20HandlerMock");
    handler = await ERC20HandlerMock.deploy();

    await token.mintTo(OWNER.address, baseBalance);
    await token.approve(await handler.getAddress(), baseBalance);

    await token.transferOwnership(await handler.getAddress());

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("depositERC20", () => {
    it("should deposit 100 tokens, isWrapped = true", async () => {
      const expectedAmount = wei("100");

      await handler.depositERC20(await token.getAddress(), expectedAmount, "receiver", "kovan", true);

      expect(await token.balanceOf(OWNER.address)).to.equal(baseBalance - expectedAmount);
      expect(await token.balanceOf(await handler.getAddress())).to.equal(0);

      const depositEvent = (await handler.queryFilter(handler.filters.DepositedERC20, -1))[0];

      expect(depositEvent.eventName).to.be.equal("DepositedERC20");
      expect(depositEvent.args.token).to.be.equal(await token.getAddress());
      expect(depositEvent.args.amount).to.be.equal(expectedAmount);
      expect(depositEvent.args.receiver).to.be.equal("receiver");
      expect(depositEvent.args.network).to.be.equal("kovan");
      expect(depositEvent.args.isWrapped).to.be.true;
    });

    it("should not burn tokens if they are not approved", async () => {
      let expectedAmount = wei("100");

      await token.approve(await handler.getAddress(), 0);

      await expect(
        handler.depositERC20(await token.getAddress(), expectedAmount, "receiver", "kovan", true),
      ).to.be.rejectedWith("ERC20: insufficient allowance");
    });

    it("should deposit 52 tokens, isWrapped = false", async () => {
      let expectedAmount = wei("52");

      await handler.depositERC20(await token.getAddress(), expectedAmount, "receiver", "kovan", false);

      expect(await token.balanceOf(OWNER.address)).to.equal(baseBalance - expectedAmount);
      expect(await token.balanceOf(await handler.getAddress())).to.equal(expectedAmount);

      const depositEvent = (await handler.queryFilter(handler.filters.DepositedERC20, -1))[0];
      expect(depositEvent.args.isWrapped).to.be.false;
    });

    it("should revert when try deposit 0 tokens", async () => {
      await expect(
        handler.depositERC20(await token.getAddress(), wei("0"), "receiver", "kovan", false),
      ).to.be.rejectedWith("ERC20Handler: amount is zero");
    });

    it("should revert when token address is 0", async () => {
      await expect(handler.depositERC20(ethers.ZeroAddress, wei("1"), "receiver", "kovan", false)).to.be.rejectedWith(
        "ERC20Handler: zero token",
      );
    });
  });

  describe("getERC20SignHash", () => {
    it("should encode args correctly", async () => {
      let expectedAmount = wei("100");
      let expectedTxHash = "0xc4f46c912cc2a1f30891552ac72871ab0f0e977886852bdd5dccd221a595647d";
      let expectedNonce = "1794147";
      let expectedChainId = 31378;
      let expectedIsWrapped = true;

      let signHash0 = await handler.getERC20SignHash(
        await token.getAddress(),
        expectedAmount,
        OWNER.address,
        expectedTxHash,
        expectedNonce,
        expectedChainId,
        expectedIsWrapped,
      );

      expect(signHash0).to.be.equal(
        ethers.keccak256(
          ethers.solidityPacked(
            ["address", "uint256", "address", "bytes32", "uint256", "uint256", "bool"],
            [
              await token.getAddress(),
              expectedAmount,
              OWNER.address,
              expectedTxHash,
              expectedNonce,
              expectedChainId,
              expectedIsWrapped,
            ],
          ),
        ),
      );

      expectedIsWrapped = false;

      let signHash1 = await handler.getERC20SignHash(
        await token.getAddress(),
        expectedAmount,
        OWNER,
        expectedTxHash,
        expectedNonce,
        expectedChainId,
        expectedIsWrapped,
      );

      expect(signHash1).to.be.equal(
        ethers.keccak256(
          ethers.solidityPacked(
            ["address", "uint256", "address", "bytes32", "uint256", "uint256", "bool"],
            [
              await token.getAddress(),
              expectedAmount,
              OWNER.address,
              expectedTxHash,
              expectedNonce,
              expectedChainId,
              expectedIsWrapped,
            ],
          ),
        ),
      );

      expect(signHash0).to.be.not.equal(signHash1);
    });
  });

  describe("withdrawERC20", () => {
    it("should withdraw 100 tokens, is wrapped = true", async () => {
      let expectedAmount = wei("100");

      await handler.depositERC20(await token.getAddress(), expectedAmount, "receiver", "kovan", true);
      await handler.withdrawERC20(await token.getAddress(), expectedAmount, OWNER, true);

      expect(await token.balanceOf(OWNER.address)).to.equal(baseBalance);
      expect(await token.balanceOf(await handler.getAddress())).to.equal(0);
    });

    it("should withdraw 52 tokens, is wrapped = false", async () => {
      let expectedAmount = wei("52");

      await handler.depositERC20(await token.getAddress(), expectedAmount, "receiver", "kovan", false);
      await handler.withdrawERC20(await token.getAddress(), expectedAmount, OWNER, false);

      expect(await token.balanceOf(OWNER.address)).to.equal(baseBalance);
      expect(await token.balanceOf(await handler.getAddress())).to.equal(0);
    });

    it("should revert when try to withdraw 0 tokens", async () => {
      await expect(handler.withdrawERC20(await token.getAddress(), wei("0"), OWNER, false)).to.be.rejectedWith(
        "ERC20Handler: amount is zero",
      );
    });

    it("should revert when try token address 0", async () => {
      await expect(handler.withdrawERC20(ethers.ZeroAddress, wei("1"), OWNER, false)).to.be.rejectedWith(
        "ERC20Handler: zero token",
      );
    });

    it("should revert when receiver address is 0", async () => {
      await expect(
        handler.withdrawERC20(await token.getAddress(), wei("100"), ethers.ZeroAddress, false),
      ).to.be.rejectedWith("ERC20Handler: zero receiver");
    });
  });
});
