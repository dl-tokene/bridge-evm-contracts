const { assert } = require("chai");
const { toBN, accounts, wei } = require("../../scripts/helpers/utils");
const truffleAssert = require("truffle-assertions");
const { artifacts, web3 } = require("hardhat");

const ERC721HandlerMock = artifacts.require("ERC721HandlerMock");
const ERC721Mock = artifacts.require("ERC721Mock");

ERC721Mock.numberFormat = "BigNumber";
ERC721HandlerMock.numberFormat = "BigNumber";

describe("ERC721Handler", () => {
  const baseId = "5000";

  let OWNER;
  let handler;
  let token;

  before("setup", async () => {
    OWNER = await accounts(0);
  });

  beforeEach("setup", async () => {
    token = await ERC721Mock.new("Mock", "MK");
    handler = await ERC721HandlerMock.new();

    await token.mintTo(OWNER, baseId);
    await token.approve(handler.address, baseId);
  });

  describe("depositERC721", () => {
    it("should deposit token, isWrapped = true", async () => {
      let tx = await handler.depositERC721(token.address, baseId, "receiver", "kovan", true);

      assert.equal(tx.receipt.logs[0].event, "DepositedERC721");
      assert.equal(tx.receipt.logs[0].args.token, token.address);
      assert.equal(tx.receipt.logs[0].args.tokenId, baseId);
      assert.equal(tx.receipt.logs[0].args.receiver, "receiver");
      assert.equal(tx.receipt.logs[0].args.network, "kovan");
      assert.isTrue(tx.receipt.logs[0].args.isWrapped);

      await truffleAssert.reverts(token.ownerOf(baseId), "ERC721: owner query for nonexistent token");
    });

    it("should deposit token, isWrapped = false", async () => {
      let tx = await handler.depositERC721(token.address, baseId, "receiver", "kovan", false);

      assert.equal(await token.ownerOf(baseId), handler.address);
      assert.equal(tx.receipt.logs[0].event, "DepositedERC721");
      assert.equal(tx.receipt.logs[0].args.token, token.address);
      assert.equal(tx.receipt.logs[0].args.tokenId, baseId);
      assert.equal(tx.receipt.logs[0].args.receiver, "receiver");
      assert.equal(tx.receipt.logs[0].args.network, "kovan");
      assert.isFalse(tx.receipt.logs[0].args.isWrapped);
    });

    it("should revert when token address is 0", async () => {
      await truffleAssert.reverts(
        handler.depositERC721("0x0000000000000000000000000000000000000000", baseId, "receiver", "kovan", false),
        "ERC721Handler: zero token"
      );
    });
  });

  describe("getERC721SignHash", () => {
    it("should encode args", async () => {
      let expectedTxHash = "0xc4f46c912cc2a1f30891552ac72871ab0f0e977886852bdd5dccd221a595647d";
      let expextedNonce = "1794147";
      let expectedChainId = 31378;
      let expectedIsWraped = true;

      let signHash0 = await handler.getERC721SignHash(
        token.address,
        baseId,
        OWNER,
        expectedTxHash,
        expextedNonce,
        expectedChainId,
        expectedIsWraped
      );

      assert.equal(
        signHash0,
        web3.utils.soliditySha3(
          { value: token.address, type: "address" },
          { value: baseId, type: "uint256" },
          { value: OWNER, type: "address" },
          { value: expectedTxHash, type: "bytes32" },
          { value: expextedNonce, type: "uint256" },
          { value: expectedChainId, type: "uint256" },
          { value: expectedIsWraped, type: "bool" }
        )
      );

      expectedIsWraped = false;

      let signHash1 = await handler.getERC721SignHash(
        token.address,
        baseId,
        OWNER,
        expectedTxHash,
        expextedNonce,
        expectedChainId,
        expectedIsWraped
      );

      assert.equal(
        signHash1,
        web3.utils.soliditySha3(
          { value: token.address, type: "address" },
          { value: baseId, type: "uint256" },
          { value: OWNER, type: "address" },
          { value: expectedTxHash, type: "bytes32" },
          { value: expextedNonce, type: "uint256" },
          { value: expectedChainId, type: "uint256" },
          { value: expectedIsWraped, type: "bool" }
        )
      );
      assert.notEqual(signHash0, signHash1);
    });
  });
});
