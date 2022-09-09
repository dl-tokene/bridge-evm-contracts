const { assert } = require("chai");
const { accounts, wei } = require("../../scripts/helpers/utils");
const ethSigUtil = require("@metamask/eth-sig-util");

const Bridge = artifacts.require("Bridge");
const ERC20MB = artifacts.require("ERC20MintableBurnable");
const ERC721MB = artifacts.require("ERC721MintableBurnable");
const ERC1155MB = artifacts.require("ERC1155MintableBurnable");

ERC1155MB.numberFormat = "BigNumber";
ERC721MB.numberFormat = "BigNumber";
ERC20MB.numberFormat = "BigNumber";
Bridge.numberFormat = "BigNumber";

const OWNER_PRIVATE_KEY = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

describe("Bridge", () => {
  const baseBalance = wei("1000");
  const baseId = "5000";
  const tokenURI = "https://some.link";
  const txHash = "0xc4f46c912cc2a1f30891552ac72871ab0f0e977886852bdd5dccd221a595647d";
  const txNonce = "1794147";

  let bridge;
  let OWNER;
  let erc20;
  let erc721;
  let erc1155;

  before("setup", async () => {
    OWNER = await accounts(0);
  });

  beforeEach("setup", async () => {
    bridge = await Bridge.new();
    await bridge.__Bridge_init([await accounts(0)], "1");

    erc20 = await ERC20MB.new("Mock", "MK", OWNER);
    await erc20.mintTo(OWNER, baseBalance);
    await erc20.approve(bridge.address, baseBalance);

    erc721 = await ERC721MB.new("Mock", "MK", OWNER, "");
    await erc721.mintTo(OWNER, baseId, tokenURI);
    await erc721.approve(bridge.address, baseId);

    erc1155 = await ERC1155MB.new("Mock", "MK", "URI", OWNER);
    await erc1155.mintTo(OWNER, baseId, baseBalance, tokenURI);
    await erc1155.setApprovalForAll(bridge.address, true);

    await erc20.transferOwnership(bridge.address);
    await erc721.transferOwnership(bridge.address);
    await erc1155.transferOwnership(bridge.address);
  });

  describe("ERC20 flow", () => {
    it("should withdrawERC20", async () => {
      const expectedAmount = wei("100");
      const expectedIsWrapped = true;
      const privateKey = Buffer.from(OWNER_PRIVATE_KEY, "hex");
      const hash = web3.utils.soliditySha3({ value: txHash, type: "bytes32" }, { value: txNonce, type: "uint256" });

      const signHash = await bridge.getERC20SignHash(
        erc20.address,
        expectedAmount,
        OWNER,
        txHash,
        txNonce,
        await web3.eth.getChainId(),
        expectedIsWrapped
      );
      const signature = ethSigUtil.personalSign({ privateKey: privateKey, data: signHash });

      await bridge.depositERC20(erc20.address, expectedAmount, "receiver", "kovan", true);
      await bridge.withdrawERC20(erc20.address, expectedAmount, OWNER, txHash, txNonce, expectedIsWrapped, [signature]);

      assert.equal((await erc20.balanceOf(OWNER)).toFixed(), baseBalance);
      assert.equal(await erc20.balanceOf(bridge.address), "0");

      assert.isTrue(await bridge.usedHashes(hash));
    });
  });

  describe("ERC721 flow", () => {
    it("should withdrawERC721", async () => {
      const expectedIsWrapped = true;
      const privateKey = Buffer.from(OWNER_PRIVATE_KEY, "hex");
      const hash = web3.utils.soliditySha3({ value: txHash, type: "bytes32" }, { value: txNonce, type: "uint256" });

      const signHash = await bridge.getERC721SignHash(
        erc721.address,
        baseId,
        OWNER,
        txHash,
        txNonce,
        await web3.eth.getChainId(),
        tokenURI,
        expectedIsWrapped
      );
      const signature = ethSigUtil.personalSign({ privateKey: privateKey, data: signHash });

      await bridge.depositERC721(erc721.address, baseId, "receiver", "kovan", expectedIsWrapped);
      await bridge.withdrawERC721(erc721.address, baseId, OWNER, txHash, txNonce, tokenURI, expectedIsWrapped, [
        signature,
      ]);

      assert.equal(await erc721.ownerOf(baseId), OWNER);
      assert.isTrue(await bridge.usedHashes(hash));
    });
  });

  describe("ERC1155 flow", () => {
    it("should withdrawERC1155", async () => {
      const expectedIsWrapped = true;
      const privateKey = Buffer.from(OWNER_PRIVATE_KEY, "hex");
      const hash = web3.utils.soliditySha3({ value: txHash, type: "bytes32" }, { value: txNonce, type: "uint256" });

      const signHash = await bridge.getERC1155SignHash(
        erc1155.address,
        baseId,
        baseBalance,
        OWNER,
        txHash,
        txNonce,
        await web3.eth.getChainId(),
        tokenURI,
        expectedIsWrapped
      );
      const signature = ethSigUtil.personalSign({ privateKey: privateKey, data: signHash });

      await bridge.depositERC1155(erc1155.address, baseId, baseBalance, "receiver", "kovan", expectedIsWrapped);
      await bridge.withdrawERC1155(
        erc1155.address,
        baseId,
        baseBalance,
        OWNER,
        txHash,
        txNonce,
        tokenURI,
        expectedIsWrapped,
        [signature]
      );

      assert.equal((await erc1155.balanceOf(OWNER, baseId)).toFixed(), baseBalance);
      assert.isTrue(await bridge.usedHashes(hash));
    });
  });

  describe("Native flow", () => {
    it("should withdrawNative", async () => {
      const privateKey = Buffer.from(OWNER_PRIVATE_KEY, "hex");
      const hash = web3.utils.soliditySha3({ value: txHash, type: "bytes32" }, { value: txNonce, type: "uint256" });

      const signHash = await bridge.getNativeSignHash(baseBalance, OWNER, txHash, txNonce, await web3.eth.getChainId());
      const signature = ethSigUtil.personalSign({ privateKey: privateKey, data: signHash });

      await bridge.depositNative("receiver", "kovan", { value: baseBalance });
      await bridge.withdrawNative(baseBalance, OWNER, txHash, txNonce, [signature]);

      assert.equal(await web3.eth.getBalance(bridge.address), 0);
      assert.isTrue(await bridge.usedHashes(hash));
    });
  });
});
