const { assert } = require("chai");
const { accounts, wei } = require("../../scripts/utils/utils");
const truffleAssert = require("truffle-assertions");

const ERC1155HandlerMock = artifacts.require("ERC1155HandlerMock");
const ERC1155MB = artifacts.require("ERC1155MintableBurnable");

ERC1155MB.numberFormat = "BigNumber";
ERC1155HandlerMock.numberFormat = "BigNumber";

describe("ERC1155Handler", () => {
  const baseAmount = "10";
  const baseId = "5000";
  const tokenURI = "https://some.link";

  let OWNER;
  let handler;
  let token;

  before("setup", async () => {
    OWNER = await accounts(0);
  });

  beforeEach("setup", async () => {
    handler = await ERC1155HandlerMock.new();
  });

  describe("ERC1155 no base uri", () => {
    beforeEach("setup", async () => {
      token = await ERC1155MB.new("Mock", "MK", "", OWNER);

      await token.mintTo(OWNER, baseId, baseAmount, tokenURI);
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
        assert.equal(tx.receipt.logs[0].args.amount, baseAmount);
        assert.equal(tx.receipt.logs[0].args.receiver, "receiver");
        assert.equal(tx.receipt.logs[0].args.network, "kovan");
        assert.isTrue(tx.receipt.logs[0].args.isWrapped);
      });

      it("should not burn tokens if they are not approved", async () => {
        await token.setApprovalForAll(handler.address, false);

        await truffleAssert.reverts(
          handler.depositERC1155(token.address, baseId, baseAmount, "receiver", "kovan", true),
          "ERC1155MintableBurnable: not approved"
        );
      });

      it("should deposit token, isWrapped = false", async () => {
        let tx = await handler.depositERC1155(token.address, baseId, baseAmount, "receiver", "kovan", false);

        assert.equal(await token.balanceOf(OWNER, baseId), "0");
        assert.equal(await token.balanceOf(handler.address, baseId), baseAmount);
        assert.equal(tx.receipt.logs[0].event, "DepositedERC1155");
        assert.equal(tx.receipt.logs[0].args.token, token.address);
        assert.equal(tx.receipt.logs[0].args.tokenId, baseId);
        assert.equal(tx.receipt.logs[0].args.amount, baseAmount);
        assert.equal(tx.receipt.logs[0].args.receiver, "receiver");
        assert.equal(tx.receipt.logs[0].args.network, "kovan");
        assert.isFalse(tx.receipt.logs[0].args.isWrapped);

        assert.equal(await token.uri(baseId), tokenURI);
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
          tokenURI,
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
            { value: tokenURI, type: "string" },
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
          tokenURI,
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
            { value: tokenURI, type: "string" },
            { value: expectedIsWrapped, type: "bool" }
          )
        );

        assert.notEqual(signHash0, signHash1);
      });
    });

    describe("withdrawERC1155", () => {
      it("should withdraw 100 tokens, wrapped = true", async () => {
        await handler.depositERC1155(token.address, baseId, baseAmount, "receiver", "kovan", true);
        await handler.withdrawERC1155(token.address, baseId, baseAmount, OWNER, tokenURI, true);

        assert.equal(await token.balanceOf(OWNER, baseId), baseAmount);
        assert.equal(await token.balanceOf(handler.address, baseId), "0");
        assert.equal(await token.uri(baseId), tokenURI);
      });

      it("should withdraw 52 tokens, wrapped = false", async () => {
        await handler.depositERC1155(token.address, baseId, baseAmount, "receiver", "kovan", false);
        await handler.withdrawERC1155(token.address, baseId, baseAmount, OWNER, tokenURI, false);

        assert.equal(await token.balanceOf(OWNER, baseId), baseAmount);
        assert.equal(await token.balanceOf(handler.address, baseId), "0");
      });

      it("should revert when token address is 0", async () => {
        await truffleAssert.reverts(
          handler.withdrawERC1155(
            "0x0000000000000000000000000000000000000000",
            baseId,
            baseAmount,
            OWNER,
            tokenURI,
            true
          ),
          "ERC1155Handler: zero token"
        );
      });

      it("should revert when amount is 0", async () => {
        await truffleAssert.reverts(
          handler.withdrawERC1155(token.address, baseId, 0, OWNER, tokenURI, true),
          "ERC1155Handler: amount is zero"
        );
      });

      it("should revert when receiver address is 0", async () => {
        await truffleAssert.reverts(
          handler.withdrawERC1155(
            token.address,
            baseId,
            baseAmount,
            "0x0000000000000000000000000000000000000000",
            tokenURI,
            true
          ),
          "ERC1155Handler: zero receiver"
        );
      });
    });
  });

  describe("ERC1155 with base metadata", () => {
    beforeEach("setup", async () => {
      token = await ERC1155MB.new("Mock", "MK", tokenURI, OWNER);

      await token.mintTo(OWNER, baseId, baseAmount, "");
      await token.setApprovalForAll(handler.address, true);

      await token.transferOwnership(handler.address);
    });

    describe("withdraw", () => {
      it("should should check correct metadata (1)", async () => {
        await handler.depositERC1155(token.address, baseId, baseAmount, "receiver", "kovan", true);
        await handler.withdrawERC1155(token.address, baseId, baseAmount, OWNER, "123", true);

        assert.equal(await token.uri(baseId), tokenURI + "123");
      });

      it("should should check correct metadata (2)", async () => {
        await handler.depositERC1155(token.address, baseId, baseAmount, "receiver", "kovan", true);
        await handler.withdrawERC1155(token.address, baseId, baseAmount, OWNER, "", true);

        assert.equal(await token.uri(baseId), tokenURI);
      });
    });
  });
});
