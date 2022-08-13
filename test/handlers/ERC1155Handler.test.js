const { assert } = require("chai");
const { accounts, wei } = require("../../scripts/helpers/utils");
const truffleAssert = require("truffle-assertions");

const ERC1155HandlerMock = artifacts.require("ERC1155HandlerMock");
const ERC1155MB = artifacts.require("ERC1155MintableBurnable");

ERC1155MB.numberFormat = "BigNumber";
ERC1155HandlerMock.numberFormat = "BigNumber";

describe("ERC1155Handler", () => {
  const baseAmount = "10";
  const baseId = "5000";

  let OWNER;
  let handler;
  let token;

  before("setup", async () => {
    OWNER = await accounts(0);
  });

  beforeEach("setup", async () => {
    token = await ERC1155MB.new("URI", OWNER);
    handler = await ERC1155HandlerMock.new();

    await token.mintTo(OWNER, baseId, baseAmount);
    await token.setApprovalForAll(handler.address, true);

    await token.transferOwnership(handler.address);
  });

  describe("depositERC1155", () => {
    it("should deposit token, isWrapped = true", async () => {
      let tx = await handler.depositERC1155(token.address, baseId, baseAmount, "receiver", "kovan", true);

      assert.equal(await token.balanceOf(OWNER, baseId), "0");
      assert.equal(tx.receipt.logs[0].event, "DepositedERC1155");
      assert.equal(tx.receipt.logs[0].args.token, token.address);
      assert.equal(tx.receipt.logs[0].args.tokenId, baseId);
      assert.equal(tx.receipt.logs[0].args.receiver, "receiver");
      assert.equal(tx.receipt.logs[0].args.network, "kovan");
      assert.isTrue(tx.receipt.logs[0].args.isWrapped);
    });

    it("should deposit token, isWrapped = false", async () => {
      let tx = await handler.depositERC1155(token.address, baseId, baseAmount, "receiver", "kovan", false);

      assert.equal(await token.balanceOf(OWNER, baseId), "0");
      assert.equal(await token.balanceOf(handler.address, baseId), baseAmount);
      assert.equal(tx.receipt.logs[0].event, "DepositedERC1155");
      assert.equal(tx.receipt.logs[0].args.token, token.address);
      assert.equal(tx.receipt.logs[0].args.tokenId, baseId);
      assert.equal(tx.receipt.logs[0].args.receiver, "receiver");
      assert.equal(tx.receipt.logs[0].args.network, "kovan");
      assert.isFalse(tx.receipt.logs[0].args.isWrapped);
    });

    it("should revert when token address is 0", async () => {
      await truffleAssert.reverts(
        handler.depositERC1155(
          "0x0000000000000000000000000000000000000000",
          baseId,
          baseAmount,
          "receiver",
          "kovan",
          false
        ),
        "ERC1155Handler: zero token"
      );
    });

    it("should revert when try deposit 0 tokens", async () => {
      let expectedAmount = wei("0");
      await truffleAssert.reverts(
        handler.depositERC1155(token.address, baseId, expectedAmount, "receiver", "kovan", false),
        "ERC1155Handler: amount is zero"
      );
    });
  });

  describe("getERC1155SignHash", () => {
    it("should encode args", async () => {
      let expectedTxHash = "0xc4f46c912cc2a1f30891552ac72871ab0f0e977886852bdd5dccd221a595647d";
      let expectedNonce = "1794147";
      let expectedChainId = 31378;
      let expectedIsWrapped = true;

      let signHash0 = await handler.getERC1155SignHash(
        token.address,
        baseId,
        baseAmount,
        OWNER,
        expectedTxHash,
        expectedNonce,
        expectedChainId,
        expectedIsWrapped
      );

      assert.equal(
        signHash0,
        web3.utils.soliditySha3(
          { value: token.address, type: "address" },
          { value: baseId, type: "uint256" },
          { value: baseAmount, type: "uint256" },
          { value: OWNER, type: "address" },
          { value: expectedTxHash, type: "bytes32" },
          { value: expectedNonce, type: "uint256" },
          { value: expectedChainId, type: "uint256" },
          { value: expectedIsWrapped, type: "bool" }
        )
      );

      expectedIsWrapped = false;

      let signHash1 = await handler.getERC1155SignHash(
        token.address,
        baseId,
        baseAmount,
        OWNER,
        expectedTxHash,
        expectedNonce,
        expectedChainId,
        expectedIsWrapped
      );

      assert.equal(
        signHash1,
        web3.utils.soliditySha3(
          { value: token.address, type: "address" },
          { value: baseId, type: "uint256" },
          { value: baseAmount, type: "uint256" },
          { value: OWNER, type: "address" },
          { value: expectedTxHash, type: "bytes32" },
          { value: expectedNonce, type: "uint256" },
          { value: expectedChainId, type: "uint256" },
          { value: expectedIsWrapped, type: "bool" }
        )
      );

      assert.notEqual(signHash0, signHash1);
    });
  });

  describe("withdrawERC721", () => {
    it("should withdraw 100 tokens, wrapped = true", async () => {
      await handler.depositERC1155(token.address, baseId, baseAmount, "receiver", "kovan", true);
      await handler.withdrawERC1155(token.address, baseId, baseAmount, OWNER, true);

      assert.equal(await token.balanceOf(OWNER, baseId), baseAmount);
      assert.equal(await token.balanceOf(handler.address, baseId), "0");
    });

    it("should withdraw 52 tokens, wrapped = false", async () => {
      await handler.depositERC1155(token.address, baseId, baseAmount, "receiver", "kovan", false);
      await handler.withdrawERC1155(token.address, baseId, baseAmount, OWNER, false);

      assert.equal(await token.balanceOf(OWNER, baseId), baseAmount);
      assert.equal(await token.balanceOf(handler.address, baseId), "0");
    });

    it("should revert when token address is 0", async () => {
      await truffleAssert.reverts(
        handler.withdrawERC1155("0x0000000000000000000000000000000000000000", baseId, baseAmount, OWNER, true),
        "ERC1155Handler: zero token"
      );
    });

    it("should revert when amount is 0", async () => {
      await truffleAssert.reverts(
        handler.withdrawERC1155(token.address, baseId, 0, OWNER, true),
        "ERC1155Handler: amount is zero"
      );
    });

    it("should revert when receiver address is 0", async () => {
      await truffleAssert.reverts(
        handler.withdrawERC1155(token.address, baseId, baseAmount, "0x0000000000000000000000000000000000000000", true),
        "ERC1155Handler: zero receiver"
      );
    });
  });
});
