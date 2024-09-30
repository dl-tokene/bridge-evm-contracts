import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { wei } from "@scripts";

import { Reverter, ERC20BridgingType } from "@test-helpers";

import { ERC20HandlerMock, ERC20MintableBurnable, USDCTokenType } from "@ethers-v6";

describe("ERC20Handler", () => {
  const reverter = new Reverter();

  const baseBalance = wei("1000000");

  let OWNER: SignerWithAddress;

  let token: ERC20MintableBurnable;
  let usdcTokenType: USDCTokenType;
  let handler: ERC20HandlerMock;

  before("setup", async () => {
    [OWNER] = await ethers.getSigners();

    const ERC20MB = await ethers.getContractFactory("ERC20MintableBurnable");
    token = await ERC20MB.deploy("Mock", "MK", OWNER.address);

    const USDCTokenType = await ethers.getContractFactory("USDCTokenType");
    usdcTokenType = await USDCTokenType.deploy("USDCMock", "USDCMock");

    const ERC20HandlerMock = await ethers.getContractFactory("ERC20HandlerMock");
    handler = await ERC20HandlerMock.deploy();

    await token.mintTo(OWNER.address, baseBalance);
    await token.approve(await handler.getAddress(), baseBalance);

    await token.transferOwnership(await handler.getAddress());

    await usdcTokenType.mint(OWNER.address, baseBalance);
    await usdcTokenType.approve(await handler.getAddress(), baseBalance);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("depositERC20", () => {
    it("should deposit 100 tokens, operationType = Wrapped", async () => {
      const expectedAmount = wei("100");

      await handler.depositERC20(
        await token.getAddress(),
        expectedAmount,
        "receiver",
        "kovan",
        ERC20BridgingType.Wrapped,
      );

      expect(await token.balanceOf(OWNER.address)).to.equal(baseBalance - expectedAmount);
      expect(await token.balanceOf(await handler.getAddress())).to.equal(0);

      const depositEvent = (await handler.queryFilter(handler.filters.DepositedERC20, -1))[0];

      expect(depositEvent.eventName).to.be.equal("DepositedERC20");
      expect(depositEvent.args.token).to.be.equal(await token.getAddress());
      expect(depositEvent.args.amount).to.be.equal(expectedAmount);
      expect(depositEvent.args.receiver).to.be.equal("receiver");
      expect(depositEvent.args.network).to.be.equal("kovan");
      expect(depositEvent.args.operationType).to.be.equal(ERC20BridgingType.Wrapped);
    });

    it("should not burn tokens if they are not approved", async () => {
      let expectedAmount = wei("100");

      await token.approve(await handler.getAddress(), 0);

      await expect(
        handler.depositERC20(await token.getAddress(), expectedAmount, "receiver", "kovan", ERC20BridgingType.Wrapped),
      ).to.be.rejectedWith("ERC20: insufficient allowance");
    });

    it("should deposit 52 tokens, operationType = LiquidityPool", async () => {
      let expectedAmount = wei("52");

      await handler.depositERC20(
        await token.getAddress(),
        expectedAmount,
        "receiver",
        "kovan",
        ERC20BridgingType.LiquidityPool,
      );

      expect(await token.balanceOf(OWNER.address)).to.equal(baseBalance - expectedAmount);
      expect(await token.balanceOf(await handler.getAddress())).to.equal(expectedAmount);

      const depositEvent = (await handler.queryFilter(handler.filters.DepositedERC20, -1))[0];
      expect(depositEvent.args.operationType).to.be.equal(ERC20BridgingType.LiquidityPool);
    });

    it("should deposit 50 tokens, operationType = USDCType", async () => {
      let expectedAmount = wei("50");

      await handler.depositERC20(
        await usdcTokenType.getAddress(),
        expectedAmount,
        "receiver",
        "kovan",
        ERC20BridgingType.USDCType,
      );

      expect(await usdcTokenType.balanceOf(OWNER.address)).to.equal(baseBalance - expectedAmount);
      expect(await usdcTokenType.balanceOf(await handler.getAddress())).to.equal(0);

      const depositEvent = (await handler.queryFilter(handler.filters.DepositedERC20, -1))[0];
      expect(depositEvent.args.operationType).to.be.equal(ERC20BridgingType.USDCType);
    });

    it("should revert when try deposit 0 tokens", async () => {
      await expect(
        handler.depositERC20(await token.getAddress(), wei("0"), "receiver", "kovan", ERC20BridgingType.LiquidityPool),
      ).to.be.rejectedWith("ERC20Handler: amount is zero");
    });

    it("should revert when token address is 0", async () => {
      await expect(
        handler.depositERC20(ethers.ZeroAddress, wei("1"), "receiver", "kovan", ERC20BridgingType.LiquidityPool),
      ).to.be.rejectedWith("ERC20Handler: zero token");
    });
  });

  describe("getERC20SignHash", () => {
    it("should encode args correctly", async () => {
      let expectedAmount = wei("100");
      let expectedTxHash = "0xc4f46c912cc2a1f30891552ac72871ab0f0e977886852bdd5dccd221a595647d";
      let expectedNonce = "1794147";
      let expectedChainId = 31378;
      let expectedOperationType = ERC20BridgingType.Wrapped;

      let signHash0 = await handler.getERC20SignHash(
        await token.getAddress(),
        expectedAmount,
        OWNER.address,
        expectedTxHash,
        expectedNonce,
        expectedChainId,
        expectedOperationType,
      );

      expect(signHash0).to.be.equal(
        ethers.keccak256(
          ethers.solidityPacked(
            ["address", "uint256", "address", "bytes32", "uint256", "uint256", "uint8"],
            [
              await token.getAddress(),
              expectedAmount,
              OWNER.address,
              expectedTxHash,
              expectedNonce,
              expectedChainId,
              expectedOperationType,
            ],
          ),
        ),
      );

      expectedOperationType = ERC20BridgingType.LiquidityPool;

      let signHash1 = await handler.getERC20SignHash(
        await token.getAddress(),
        expectedAmount,
        OWNER,
        expectedTxHash,
        expectedNonce,
        expectedChainId,
        expectedOperationType,
      );

      expect(signHash1).to.be.equal(
        ethers.keccak256(
          ethers.solidityPacked(
            ["address", "uint256", "address", "bytes32", "uint256", "uint256", "uint8"],
            [
              await token.getAddress(),
              expectedAmount,
              OWNER.address,
              expectedTxHash,
              expectedNonce,
              expectedChainId,
              expectedOperationType,
            ],
          ),
        ),
      );

      expectedOperationType = ERC20BridgingType.USDCType;

      let signHash2 = await handler.getERC20SignHash(
        await token.getAddress(),
        expectedAmount,
        OWNER,
        expectedTxHash,
        expectedNonce,
        expectedChainId,
        expectedOperationType,
      );

      expect(signHash2).to.be.equal(
        ethers.keccak256(
          ethers.solidityPacked(
            ["address", "uint256", "address", "bytes32", "uint256", "uint256", "uint8"],
            [
              await token.getAddress(),
              expectedAmount,
              OWNER.address,
              expectedTxHash,
              expectedNonce,
              expectedChainId,
              expectedOperationType,
            ],
          ),
        ),
      );

      expect(signHash0).to.be.not.equal(signHash1).and.to.be.not.equal(signHash2);
    });
  });

  describe("withdrawERC20", () => {
    it("should withdraw 100 tokens, operationType = Wrapped", async () => {
      let expectedAmount = wei("100");

      await handler.depositERC20(
        await token.getAddress(),
        expectedAmount,
        "receiver",
        "kovan",
        ERC20BridgingType.Wrapped,
      );
      await handler.withdrawERC20(await token.getAddress(), expectedAmount, OWNER, ERC20BridgingType.Wrapped);

      expect(await token.balanceOf(OWNER.address)).to.equal(baseBalance);
      expect(await token.balanceOf(await handler.getAddress())).to.equal(0);
    });

    it("should withdraw 52 tokens, operationType = LiquidityPool", async () => {
      let expectedAmount = wei("52");

      await handler.depositERC20(
        await token.getAddress(),
        expectedAmount,
        "receiver",
        "kovan",
        ERC20BridgingType.LiquidityPool,
      );
      await handler.withdrawERC20(await token.getAddress(), expectedAmount, OWNER, ERC20BridgingType.LiquidityPool);

      expect(await token.balanceOf(OWNER.address)).to.equal(baseBalance);
      expect(await token.balanceOf(await handler.getAddress())).to.equal(0);
    });

    it("should withdraw 50 tokens, operationType = USDCType", async () => {
      let expectedAmount = wei("50");

      await handler.depositERC20(
        await usdcTokenType.getAddress(),
        expectedAmount,
        "receiver",
        "kovan",
        ERC20BridgingType.USDCType,
      );
      await handler.withdrawERC20(await usdcTokenType.getAddress(), expectedAmount, OWNER, ERC20BridgingType.USDCType);

      expect(await usdcTokenType.balanceOf(OWNER.address)).to.equal(baseBalance);
      expect(await usdcTokenType.balanceOf(await handler.getAddress())).to.equal(0);
    });

    it("should revert when try to withdraw 0 tokens", async () => {
      await expect(
        handler.withdrawERC20(await token.getAddress(), wei("0"), OWNER, ERC20BridgingType.LiquidityPool),
      ).to.be.rejectedWith("ERC20Handler: amount is zero");
    });

    it("should revert when try token address 0", async () => {
      await expect(
        handler.withdrawERC20(ethers.ZeroAddress, wei("1"), OWNER, ERC20BridgingType.LiquidityPool),
      ).to.be.rejectedWith("ERC20Handler: zero token");
    });

    it("should revert when receiver address is 0", async () => {
      await expect(
        handler.withdrawERC20(
          await token.getAddress(),
          wei("100"),
          ethers.ZeroAddress,
          ERC20BridgingType.LiquidityPool,
        ),
      ).to.be.rejectedWith("ERC20Handler: zero receiver");
    });
  });
});
