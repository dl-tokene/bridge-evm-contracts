import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { Reverter } from "@test-helpers";

import { ERC721HandlerMock, ERC721MintableBurnable } from "@ethers-v6";

describe("ERC721Handler", () => {
  const reverter = new Reverter();

  const baseId = "5000";
  const tokenURI = "https://some.link";

  let OWNER: SignerWithAddress;
  let SECOND: SignerWithAddress;

  let token: ERC721MintableBurnable;
  let handler: ERC721HandlerMock;

  before("setup", async () => {
    [OWNER, SECOND] = await ethers.getSigners();

    const ERC721MB = await ethers.getContractFactory("ERC721MintableBurnable");
    token = await ERC721MB.deploy("Mock", "MK", OWNER.address, "");

    const ERC721HandlerMock = await ethers.getContractFactory("ERC721HandlerMock");
    handler = await ERC721HandlerMock.deploy();

    await token.mintTo(OWNER.address, baseId, tokenURI);
    await token.approve(await handler.getAddress(), baseId);

    await token.transferOwnership(await handler.getAddress());

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("ERC721 no base uri", () => {
    describe("depositERC721", () => {
      it("should deposit token, isWrapped = true", async () => {
        await handler.depositERC721(await token.getAddress(), baseId, "receiver", "kovan", true);

        const depositEvent = (await handler.queryFilter(handler.filters.DepositedERC721, -1))[0];

        expect(depositEvent.eventName).to.be.equal("DepositedERC721");
        expect(depositEvent.args.token).to.be.equal(await token.getAddress());
        expect(depositEvent.args.tokenId).to.be.equal(baseId);
        expect(depositEvent.args.receiver).to.be.equal("receiver");
        expect(depositEvent.args.network).to.be.equal("kovan");
        expect(depositEvent.args.isWrapped).to.be.true;

        await expect(token.ownerOf(baseId)).to.be.rejectedWith("ERC721: owner query for nonexistent token");
      });

      it("should deposit token, isWrapped = true (2)", async () => {
        await token.approve(ethers.ZeroAddress, baseId);
        await token.setApprovalForAll(await handler.getAddress(), true);

        await expect(handler.depositERC721(await token.getAddress(), baseId, "receiver", "kovan", true)).to.be
          .eventually.fulfilled;
      });

      it("should not burn token if it is not approved", async () => {
        await token.approve(ethers.ZeroAddress, baseId);

        await expect(
          handler.depositERC721(await token.getAddress(), baseId, "receiver", "kovan", true),
        ).to.be.rejectedWith("ERC721MintableBurnable: not approved");
      });

      it("should not burn token if it is approved but not owned", async () => {
        await expect(
          handler.connect(SECOND).depositERC721(await token.getAddress(), baseId, "receiver", "kovan", true),
        ).to.be.rejectedWith("ERC721MintableBurnable: not approved");
      });

      it("should deposit token, isWrapped = false", async () => {
        await handler.depositERC721(await token.getAddress(), baseId, "receiver", "kovan", false);

        const depositEvent = (await handler.queryFilter(handler.filters.DepositedERC721, -1))[0];

        expect(depositEvent.args.isWrapped).to.be.false;

        expect(await token.tokenURI(baseId)).to.be.equal(tokenURI);
      });

      it("should revert when token address is 0", async () => {
        await expect(handler.depositERC721(ethers.ZeroAddress, baseId, "receiver", "kovan", false)).to.be.rejectedWith(
          "ERC721Handler: zero token",
        );
      });
    });

    describe("getERC721SignHash", () => {
      it("should encode args", async () => {
        let expectedTxHash = "0xc4f46c912cc2a1f30891552ac72871ab0f0e977886852bdd5dccd221a595647d";
        let expectedNonce = "1794147";
        let expectedChainId = 31378;
        let expectedIsWrapped = true;

        let signHash0 = await handler.getERC721SignHash(
          await token.getAddress(),
          baseId,
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
              ["address", "uint256", "address", "bytes32", "uint256", "uint256", "string", "bool"],
              [
                await token.getAddress(),
                baseId,
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

        let signHash1 = await handler.getERC721SignHash(
          await token.getAddress(),
          baseId,
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
              ["address", "uint256", "address", "bytes32", "uint256", "uint256", "string", "bool"],
              [
                await token.getAddress(),
                baseId,
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

        expect(signHash0).to.not.be.equal(signHash1);
      });
    });

    describe("withdrawERC721", async () => {
      it("should withdraw token, wrapped = true", async () => {
        await handler.depositERC721(await token.getAddress(), baseId, "receiver", "kovan", true);
        await handler.withdrawERC721(await token.getAddress(), baseId, OWNER, tokenURI, true);

        expect(await token.ownerOf(baseId)).to.be.equal(OWNER.address);
        expect(await token.tokenURI(baseId)).to.be.equal(tokenURI);
      });

      it("should withdraw token, wrapped = false", async () => {
        await handler.depositERC721(await token.getAddress(), baseId, "receiver", "kovan", false);
        await handler.withdrawERC721(await token.getAddress(), baseId, OWNER, tokenURI, false);

        expect(await token.ownerOf(baseId)).to.be.equal(OWNER.address);
      });

      it("should revert when token address is 0", async () => {
        await expect(handler.withdrawERC721(ethers.ZeroAddress, baseId, OWNER, tokenURI, false)).to.be.rejectedWith(
          "ERC721Handler: zero token",
        );
      });

      it("should revert when receiver address is 0", async () => {
        await expect(
          handler.withdrawERC721(await token.getAddress(), baseId, ethers.ZeroAddress, tokenURI, false),
        ).to.be.rejectedWith("ERC721Handler: zero receiver");
      });
    });
  });

  describe("ERC721 with base metadata", () => {
    let tokenWithMetadata: ERC721MintableBurnable;

    beforeEach("setup", async () => {
      const ERC721MB = await ethers.getContractFactory("ERC721MintableBurnable");
      tokenWithMetadata = await ERC721MB.deploy("Mock", "MK", OWNER.address, tokenURI);

      await tokenWithMetadata.mintTo(OWNER, baseId, "");
      await tokenWithMetadata.approve(await handler.getAddress(), baseId);

      await tokenWithMetadata.transferOwnership(await handler.getAddress());
    });

    describe("withdraw", () => {
      it("should should check correct metadata (1)", async () => {
        await handler.depositERC721(await tokenWithMetadata.getAddress(), baseId, "receiver", "kovan", true);
        await handler.withdrawERC721(await tokenWithMetadata.getAddress(), baseId, OWNER, "123", true);

        expect(await tokenWithMetadata.tokenURI(baseId)).to.be.equal(tokenURI + "123");
      });

      it("should should check correct metadata (2)", async () => {
        await handler.depositERC721(await tokenWithMetadata.getAddress(), baseId, "receiver", "kovan", true);
        await handler.withdrawERC721(await tokenWithMetadata.getAddress(), baseId, OWNER, "", true);

        expect(await tokenWithMetadata.tokenURI(baseId)).to.be.equal(tokenURI + baseId);
      });
    });
  });

  describe("coverage", () => {
    it("(ERC721) should support relevant interfaces", async () => {
      // IERC165 -- 0x01ffc9a7
      expect(await token.supportsInterface("0x01ffc9a7")).to.be.true;

      // IERC721 -- 0x80ac58cd
      expect(await token.supportsInterface("0x80ac58cd")).to.be.true;

      // IERC721Metadata -- 0x5b5e139f
      expect(await token.supportsInterface("0x5b5e139f")).to.be.true;

      // IERC721Enumerable -- 0x780e9d63
      expect(await token.supportsInterface("0x780e9d63")).to.be.true;
    });
  });
});
