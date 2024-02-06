import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { Reverter } from "@test-helpers";

import { ERC1155HandlerMock, ERC1155MintableBurnable } from "@ethers-v6";

describe("ERC1155Handler", () => {
  const reverter = new Reverter();

  const baseAmount = "10";
  const baseId = "5000";
  const tokenURI = "https://some.link";

  let OWNER: SignerWithAddress;

  let token: ERC1155MintableBurnable;
  let handler: ERC1155HandlerMock;

  before("setup", async () => {
    [OWNER] = await ethers.getSigners();

    const ERC1155MB = await ethers.getContractFactory("ERC1155MintableBurnable");
    token = await ERC1155MB.deploy("Mock", "MK", "", OWNER.address);

    const ERC1155HandlerMock = await ethers.getContractFactory("ERC1155HandlerMock");
    handler = await ERC1155HandlerMock.deploy();

    await token.mintTo(OWNER, baseId, baseAmount, tokenURI);
    await token.setApprovalForAll(await handler.getAddress(), true);

    await token.transferOwnership(await handler.getAddress());

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("ERC1155 no base uri", () => {
    describe("depositERC1155", () => {
      it("should deposit token, isWrapped = true", async () => {
        await handler.depositERC1155(await token.getAddress(), baseId, baseAmount, "receiver", "kovan", true);

        expect(await token.balanceOf(OWNER, baseId)).to.equal("0");

        const depositEvent = (await handler.queryFilter(handler.filters.DepositedERC1155, -1))[0];

        expect(depositEvent.eventName).to.be.equal("DepositedERC1155");
        expect(depositEvent.args.token).to.be.equal(await token.getAddress());
        expect(depositEvent.args.tokenId).to.be.equal(baseId);
        expect(depositEvent.args.amount).to.be.equal(baseAmount);
        expect(depositEvent.args.receiver).to.be.equal("receiver");
        expect(depositEvent.args.network).to.be.equal("kovan");
        expect(depositEvent.args.isWrapped).to.be.true;
      });

      it("should not burn tokens if they are not approved", async () => {
        await token.setApprovalForAll(await handler.getAddress(), false);

        await expect(
          handler.depositERC1155(await token.getAddress(), baseId, baseAmount, "receiver", "kovan", true),
        ).to.be.rejectedWith("ERC1155MintableBurnable: not approved");
      });

      it("should deposit token, isWrapped = false", async () => {
        await handler.depositERC1155(await token.getAddress(), baseId, baseAmount, "receiver", "kovan", false);

        expect(await token.balanceOf(OWNER, baseId)).to.equal("0");
        expect(await token.balanceOf(await handler.getAddress(), baseId)).to.equal(baseAmount);

        const depositEvent = (await handler.queryFilter(handler.filters.DepositedERC1155, -1))[0];

        expect(depositEvent.args.isWrapped).to.be.false;

        expect(await token.uri(baseId)).to.be.equal(tokenURI);
      });

      it("should revert when token address is 0", async () => {
        await expect(
          handler.depositERC1155(ethers.ZeroAddress, baseId, baseAmount, "receiver", "kovan", false),
        ).to.be.rejectedWith("ERC1155Handler: zero token");
      });

      it("should revert when try deposit 0 tokens", async () => {
        await expect(
          handler.depositERC1155(await token.getAddress(), baseId, "0", "receiver", "kovan", false),
        ).to.be.rejectedWith("ERC1155Handler: amount is zero");
      });
    });

    describe("getERC1155SignHash", () => {
      it("should encode args", async () => {
        let expectedTxHash = "0xc4f46c912cc2a1f30891552ac72871ab0f0e977886852bdd5dccd221a595647d";
        let expectedNonce = "1794147";
        let expectedChainId = 31378;
        let expectedIsWrapped = true;

        let signHash0 = await handler.getERC1155SignHash(
          await token.getAddress(),
          baseId,
          baseAmount,
          OWNER,
          expectedTxHash,
          expectedNonce,
          expectedChainId,
          tokenURI,
          expectedIsWrapped,
        );

        expect(signHash0).to.be.equal(
          ethers.keccak256(
            ethers.solidityPacked(
              ["address", "uint256", "uint256", "address", "bytes32", "uint256", "uint256", "string", "bool"],
              [
                await token.getAddress(),
                baseId,
                baseAmount,
                OWNER.address,
                expectedTxHash,
                expectedNonce,
                expectedChainId,
                tokenURI,
                expectedIsWrapped,
              ],
            ),
          ),
        );

        expectedIsWrapped = false;

        let signHash1 = await handler.getERC1155SignHash(
          await token.getAddress(),
          baseId,
          baseAmount,
          OWNER,
          expectedTxHash,
          expectedNonce,
          expectedChainId,
          tokenURI,
          expectedIsWrapped,
        );

        expect(signHash1).to.be.equal(
          ethers.keccak256(
            ethers.solidityPacked(
              ["address", "uint256", "uint256", "address", "bytes32", "uint256", "uint256", "string", "bool"],
              [
                await token.getAddress(),
                baseId,
                baseAmount,
                OWNER.address,
                expectedTxHash,
                expectedNonce,
                expectedChainId,
                tokenURI,
                expectedIsWrapped,
              ],
            ),
          ),
        );

        expect(signHash0).to.be.not.equal(signHash1);
      });
    });

    describe("withdrawERC1155", () => {
      it("should withdraw 100 tokens, wrapped = true", async () => {
        await handler.depositERC1155(await token.getAddress(), baseId, baseAmount, "receiver", "kovan", true);
        await handler.withdrawERC1155(await token.getAddress(), baseId, baseAmount, OWNER, tokenURI, true);

        expect(await token.balanceOf(OWNER, baseId)).to.equal(baseAmount);
        expect(await token.balanceOf(await handler.getAddress(), baseId)).to.equal("0");
        expect(await token.uri(baseId)).to.equal(tokenURI);
      });

      it("should withdraw 52 tokens, wrapped = false", async () => {
        await handler.depositERC1155(await token.getAddress(), baseId, baseAmount, "receiver", "kovan", false);
        await handler.withdrawERC1155(await token.getAddress(), baseId, baseAmount, OWNER, tokenURI, false);

        expect(await token.balanceOf(OWNER, baseId)).to.equal(baseAmount);
        expect(await token.balanceOf(await handler.getAddress(), baseId)).to.equal("0");
      });

      it("should revert when token address is 0", async () => {
        await expect(
          handler.withdrawERC1155(ethers.ZeroAddress, baseId, baseAmount, OWNER, tokenURI, true),
        ).to.be.rejectedWith("ERC1155Handler: zero token");
      });

      it("should revert when amount is 0", async () => {
        await expect(
          handler.withdrawERC1155(await token.getAddress(), baseId, "0", OWNER, tokenURI, true),
        ).to.be.rejectedWith("ERC1155Handler: amount is zero");
      });

      it("should revert when receiver address is 0", async () => {
        await expect(
          handler.withdrawERC1155(await token.getAddress(), baseId, baseAmount, ethers.ZeroAddress, tokenURI, true),
        ).to.be.rejectedWith("ERC1155Handler: zero receiver");
      });
    });
  });

  describe("ERC1155 with base metadata", () => {
    beforeEach("setup", async () => {
      const ERC1155MB = await ethers.getContractFactory("ERC1155MintableBurnable");
      token = await ERC1155MB.deploy("Mock", "MK", tokenURI, OWNER.address);

      await token.mintTo(OWNER, baseId, baseAmount, "");
      await token.setApprovalForAll(await handler.getAddress(), true);

      await token.transferOwnership(await handler.getAddress());
    });

    describe("withdraw", () => {
      it("should should check correct metadata (1)", async () => {
        await handler.depositERC1155(await token.getAddress(), baseId, baseAmount, "receiver", "kovan", true);
        await handler.withdrawERC1155(await token.getAddress(), baseId, baseAmount, OWNER, "123", true);

        expect(await token.uri(baseId)).to.be.equal(tokenURI + "123");
      });

      it("should should check correct metadata (2)", async () => {
        await handler.depositERC1155(await token.getAddress(), baseId, baseAmount, "receiver", "kovan", true);
        await handler.withdrawERC1155(await token.getAddress(), baseId, baseAmount, OWNER, "", true);

        expect(await token.uri(baseId)).to.be.equal(tokenURI);
      });
    });
  });
});
