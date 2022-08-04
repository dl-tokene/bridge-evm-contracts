const { assert } = require("chai");
const { toBN, accounts, wei } = require("../../scripts/helpers/utils");
const truffleAssert = require("truffle-assertions");
const ethSigUtil = require("@metamask/eth-sig-util");

const Bridge = artifacts.require("Bridge");
const ERC20Mock = artifacts.require("ERC20Mock");
const ERC721Mock = artifacts.require("ERC721Mock");
const ERC1155Mock = artifacts.require("ERC1155Mock");

ERC1155Mock.numberFormat = "BigNumber";
ERC721Mock.numberFormat = "BigNumber";
ERC20Mock.numberFormat = "BigNumber";
Bridge.numberFormat = "BigNumber";

const OWNER_PRIVATE_KEY = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const ANOTHER_PRIVATE_KEY = "df57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e";

describe("Bridge", () => {
  const baseBalance = wei("1000");
  const baseId = "5000";
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

    erc20 = await ERC20Mock.new("Mock", "MK");
    await erc20.mintTo(OWNER, baseBalance);
    await erc20.approve(bridge.address, baseBalance);

    erc721 = await ERC721Mock.new("Mock", "MK");
    await erc721.mintTo(OWNER, baseId);
    await erc721.approve(bridge.address, baseId);

    erc1155 = await ERC1155Mock.new("URI");
    await erc1155.mintTo(OWNER, baseId, baseBalance);
    await erc1155.setApprovalForAll(bridge.address, true);
  });

  describe("withdrawERC20", () => {
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
      await bridge.withdrawERC20(erc20.address, expectedAmount, txHash, txNonce, expectedIsWrapped, [signature]);

      assert.equal((await erc20.balanceOf(OWNER)).toFixed(), baseBalance);
      assert.equal(await erc20.balanceOf(bridge.address), "0");

      assert.isTrue(await bridge.usedHashes(hash));
    });
  });

  describe("withdrawERC721", () => {
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
        expectedIsWrapped
      );
      const signature = ethSigUtil.personalSign({ privateKey: privateKey, data: signHash });

      await bridge.depositERC721(erc721.address, baseId, "receiver", "kovan", expectedIsWrapped);
      await bridge.withdrawERC721(erc721.address, baseId, txHash, txNonce, expectedIsWrapped, [signature]);

      assert.equal(await erc721.ownerOf(baseId), OWNER);
      assert.isTrue(await bridge.usedHashes(hash));
    });
  });

  describe("withdrawERC1155", () => {
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
        expectedIsWrapped
      );
      const signature = ethSigUtil.personalSign({ privateKey: privateKey, data: signHash });

      await bridge.depositERC1155(erc1155.address, baseId, baseBalance, "receiver", "kovan", expectedIsWrapped);
      await bridge.withdrawERC1155(erc1155.address, baseId, baseBalance, txHash, txNonce, expectedIsWrapped, [
        signature,
      ]);

      assert.equal((await erc1155.balanceOf(OWNER, baseId)).toFixed(), baseBalance);
      assert.isTrue(await bridge.usedHashes(hash));
    });
  });

  describe("withdrawNative", () => {
    it("should withdrawNative", async () => {
      const privateKey = Buffer.from(OWNER_PRIVATE_KEY, "hex");
      const hash = web3.utils.soliditySha3({ value: txHash, type: "bytes32" }, { value: txNonce, type: "uint256" });

      const signHash = await bridge.getNativeSignHash(baseBalance, OWNER, txHash, txNonce, await web3.eth.getChainId());
      const signature = ethSigUtil.personalSign({ privateKey: privateKey, data: signHash });

      await bridge.depositNative("receiver", "kovan", { value: baseBalance });
      await bridge.withdrawNative(baseBalance, txHash, txNonce, [signature]);

      assert.equal(await web3.eth.getBalance(bridge.address), 0);
      assert.isTrue(await bridge.usedHashes(hash));
    });
  });
});
