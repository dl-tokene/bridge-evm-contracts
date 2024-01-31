import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { wei } from "@scripts";
import { getSignature, Reverter } from "@test-helpers";

import { ERC20MintableBurnable, Bridge, ERC721MintableBurnable, ERC1155MintableBurnable } from "@ethers-v6";

describe("Bridge", () => {
  const reverter = new Reverter();

  const baseBalance = wei("1000");
  const baseId = "5000";
  const tokenURI = "https://some.link";
  const txHash = "0xc4f46c912cc2a1f30891552ac72871ab0f0e977886852bdd5dccd221a595647d";
  const txNonce = "1794147";

  const hash = ethers.keccak256(ethers.solidityPacked(["bytes32", "uint256"], [txHash, txNonce]));

  let OWNER: SignerWithAddress;
  let SECOND: SignerWithAddress;

  let bridge: Bridge;
  let erc20: ERC20MintableBurnable;
  let erc721: ERC721MintableBurnable;
  let erc1155: ERC1155MintableBurnable;

  before("setup", async () => {
    [OWNER, SECOND] = await ethers.getSigners();

    const Bridge = await ethers.getContractFactory("Bridge");

    bridge = await Bridge.deploy();
    await bridge.__Bridge_init([OWNER.address], "1");

    const ERC20MB = await ethers.getContractFactory("ERC20MintableBurnable");
    const ERC721MB = await ethers.getContractFactory("ERC721MintableBurnable");
    const ERC1155MB = await ethers.getContractFactory("ERC1155MintableBurnable");

    erc20 = await ERC20MB.deploy("Mock", "MK", OWNER.address);
    await erc20.mintTo(OWNER.address, baseBalance);
    await erc20.approve(await bridge.getAddress(), baseBalance);

    erc721 = await ERC721MB.deploy("Mock", "MK", OWNER.address, "");
    await erc721.mintTo(OWNER.address, baseId, tokenURI);
    await erc721.approve(await bridge.getAddress(), baseId);

    erc1155 = await ERC1155MB.deploy("Mock", "MK", "URI", OWNER.address);
    await erc1155.mintTo(OWNER.address, baseId, baseBalance, tokenURI);
    await erc1155.setApprovalForAll(await bridge.getAddress(), true);

    await erc20.transferOwnership(await bridge.getAddress());
    await erc721.transferOwnership(await bridge.getAddress());
    await erc1155.transferOwnership(await bridge.getAddress());

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("access", () => {
    it("should not initialize twice", async () => {
      await expect(bridge.__Bridge_init([OWNER.address], "1")).to.be.rejectedWith(
        "Initializable: contract is already initialized",
      );
    });

    it("only owner should call these functions", async () => {
      await expect(erc20.mintTo(OWNER.address, 1)).to.be.rejectedWith("Ownable: caller is not the owner");
      await expect(erc721.mintTo(OWNER.address, 1, "")).to.be.rejectedWith("Ownable: caller is not the owner");
      await expect(erc1155.mintTo(OWNER.address, 1, 1, "")).to.be.rejectedWith("Ownable: caller is not the owner");

      await expect(erc20.burnFrom(OWNER.address, 1)).to.be.rejectedWith("Ownable: caller is not the owner");
      await expect(erc721.burnFrom(OWNER.address, 1)).to.be.rejectedWith("Ownable: caller is not the owner");
      await expect(erc1155.burnFrom(OWNER.address, 1, 1)).to.be.rejectedWith("Ownable: caller is not the owner");

      await expect(bridge.connect(SECOND).addHash(txHash, txNonce)).to.be.rejectedWith(
        "Ownable: caller is not the owner",
      );
    });
  });

  describe("ERC20 flow", () => {
    it("should withdrawERC20", async () => {
      const expectedAmount = wei("100");
      const expectedIsWrapped = true;

      const signHash = await bridge.getERC20SignHash(
        await erc20.getAddress(),
        expectedAmount,
        OWNER,
        txHash,
        txNonce,
        (await ethers.provider.getNetwork()).chainId,
        expectedIsWrapped,
      );
      const signature = await getSignature(OWNER, signHash);

      await bridge.depositERC20(await erc20.getAddress(), expectedAmount, "receiver", "kovan", true);
      await bridge.withdrawERC20(await erc20.getAddress(), expectedAmount, OWNER, txHash, txNonce, expectedIsWrapped, [
        signature,
      ]);

      expect(await erc20.balanceOf(OWNER)).to.equal(baseBalance);
      expect(await erc20.balanceOf(await bridge.getAddress())).to.equal(0);

      expect(await bridge.usedHashes(hash)).to.be.true;
    });
  });

  describe("ERC721 flow", () => {
    it("should withdrawERC721", async () => {
      const expectedIsWrapped = true;

      const signHash = await bridge.getERC721SignHash(
        await erc721.getAddress(),
        baseId,
        OWNER,
        txHash,
        txNonce,
        (await ethers.provider.getNetwork()).chainId,
        tokenURI,
        expectedIsWrapped,
      );
      const signature = await getSignature(OWNER, signHash);

      await bridge.depositERC721(await erc721.getAddress(), baseId, "receiver", "kovan", expectedIsWrapped);
      await bridge.withdrawERC721(
        await erc721.getAddress(),
        baseId,
        OWNER,
        txHash,
        txNonce,
        tokenURI,
        expectedIsWrapped,
        [signature],
      );

      expect(await erc721.ownerOf(baseId)).to.equal(OWNER.address);
      expect(await erc721.tokenURI(baseId)).to.equal(tokenURI);
    });
  });

  describe("ERC1155 flow", () => {
    it("should withdrawERC1155", async () => {
      const expectedIsWrapped = true;

      const signHash = await bridge.getERC1155SignHash(
        await erc1155.getAddress(),
        baseId,
        baseBalance,
        OWNER,
        txHash,
        txNonce,
        (await ethers.provider.getNetwork()).chainId,
        tokenURI,
        expectedIsWrapped,
      );
      const signature = await getSignature(OWNER, signHash);

      await bridge.depositERC1155(
        await erc1155.getAddress(),
        baseId,
        baseBalance,
        "receiver",
        "kovan",
        expectedIsWrapped,
      );
      await bridge.withdrawERC1155(
        await erc1155.getAddress(),
        baseId,
        baseBalance,
        OWNER,
        txHash,
        txNonce,
        tokenURI,
        expectedIsWrapped,
        [signature],
      );

      expect(await erc1155.balanceOf(OWNER, baseId)).to.equal(baseBalance);
      expect(await bridge.usedHashes(hash)).to.be.true;
    });
  });

  describe("Native flow", () => {
    it("should withdrawNative", async () => {
      const signHash = await bridge.getNativeSignHash(
        baseBalance,
        OWNER,
        txHash,
        txNonce,
        (await ethers.provider.getNetwork()).chainId,
      );
      const signature = await getSignature(OWNER, signHash);

      await bridge.depositNative("receiver", "kovan", { value: baseBalance });
      await bridge.withdrawNative(baseBalance, OWNER, txHash, txNonce, [signature]);

      expect(await ethers.provider.getBalance(await bridge.getAddress())).to.equal(0);
      expect(await bridge.usedHashes(hash)).to.be.true;
    });
  });

  describe("add hash", () => {
    it("should add hash", async () => {
      expect(await bridge.usedHashes(hash)).to.be.false;

      await bridge.addHash(txHash, txNonce);

      expect(await bridge.usedHashes(hash)).to.be.true;
    });
  });
});
