const { assert } = require("chai");
const { accounts } = require("../../scripts/utils/utils");
const truffleAssert = require("truffle-assertions");

const ERC721HandlerMock = artifacts.require("ERC721HandlerMock");
const ERC721MB = artifacts.require("ERC721MintableBurnable");

ERC721MB.numberFormat = "BigNumber";
ERC721HandlerMock.numberFormat = "BigNumber";

describe("ERC721Handler", () => {
  const baseId = "5000";
  const tokenURI = "https://some.link";

  let OWNER;
  let SECOND;
  let handler;
  let token;

  before("setup", async () => {
    OWNER = await accounts(0);
    SECOND = await accounts(1);
  });

  beforeEach("setup", async () => {
    handler = await ERC721HandlerMock.new();
  });

  describe("ERC721 no base uri", () => {
    beforeEach("setup", async () => {
      token = await ERC721MB.new("Mock", "MK", OWNER, "");

      await token.mintTo(OWNER, baseId, tokenURI);
      await token.approve(handler.address, baseId);

      await token.transferOwnership(handler.address);
    });

    describe("depositERC721", () => {
      it("should deposit token, isWrapped = true", async () => {
        assert.isFalse(await token.supportsInterface("0x00000000"));

        let tx = await handler.depositERC721(token.address, baseId, "receiver", "kovan", true);

        assert.equal(tx.receipt.logs[0].event, "DepositedERC721");
        assert.equal(tx.receipt.logs[0].args.token, token.address);
        assert.equal(tx.receipt.logs[0].args.tokenId, baseId);
        assert.equal(tx.receipt.logs[0].args.receiver, "receiver");
        assert.equal(tx.receipt.logs[0].args.network, "kovan");
        assert.isTrue(tx.receipt.logs[0].args.isWrapped);

        await truffleAssert.reverts(token.ownerOf(baseId), "ERC721: owner query for nonexistent token");
      });

      it("should deposit token, isWrapped = true (2)", async () => {
        await token.approve("0x0000000000000000000000000000000000000000", baseId);
        await token.setApprovalForAll(handler.address, true);

        await truffleAssert.passes(handler.depositERC721(token.address, baseId, "receiver", "kovan", true), "pass");
      });

      it("should not burn token if it is not approved", async () => {
        await token.approve(token.address, baseId);

        await truffleAssert.reverts(
          handler.depositERC721(token.address, baseId, "receiver", "kovan", true),
          "ERC721MintableBurnable: not approved"
        );
      });

      it("should not burn token if it is approved but not owned", async () => {
        await truffleAssert.reverts(
          handler.depositERC721(token.address, baseId, "receiver", "kovan", true, { from: SECOND }),
          "ERC721MintableBurnable: not approved"
        );
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

        assert.equal(await token.tokenURI(baseId), tokenURI);
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
        let expectedNonce = "1794147";
        let expectedChainId = 31378;
        let expectedIsWrapped = true;

        let signHash0 = await handler.getERC721SignHash(
          token.address,
          baseId,
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
            { value: OWNER, type: "address" },
            { value: expectedTxHash, type: "bytes32" },
            { value: expectedNonce, type: "uint256" },
            { value: expectedChainId, type: "uint256" },
            { value: tokenURI, type: "string" },
            { value: expectedIsWrapped, type: "bool" }
          )
        );

        expectedIsWrapped = false;

        let signHash1 = await handler.getERC721SignHash(
          token.address,
          baseId,
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

    describe("withdrawERC721", async () => {
      it("should withdraw token, wrapped = true", async () => {
        await handler.depositERC721(token.address, baseId, "receiver", "kovan", true);
        await handler.withdrawERC721(token.address, baseId, OWNER, tokenURI, true);

        assert.equal(await token.ownerOf(baseId), OWNER);
        assert.equal(await token.tokenURI(baseId), tokenURI);
      });

      it("should check correct URI", async () => {});

      it("should withdraw token, wrapped = false", async () => {
        await handler.depositERC721(token.address, baseId, "receiver", "kovan", false);
        await handler.withdrawERC721(token.address, baseId, OWNER, tokenURI, false);

        assert.equal(await token.ownerOf(baseId), OWNER);
      });

      it("should revert when token address is 0", async () => {
        await truffleAssert.reverts(
          handler.withdrawERC721("0x0000000000000000000000000000000000000000", baseId, OWNER, tokenURI, false),
          "ERC721Handler: zero token"
        );
      });

      it("should revert when receiver address is 0", async () => {
        await truffleAssert.reverts(
          handler.withdrawERC721(token.address, baseId, "0x0000000000000000000000000000000000000000", tokenURI, false),
          "ERC721Handler: zero receiver"
        );
      });
    });
  });

  describe("ERC721 with base metadata", () => {
    beforeEach("setup", async () => {
      token = await ERC721MB.new("Mock", "MK", OWNER, tokenURI);

      await token.mintTo(OWNER, baseId, "");
      await token.approve(handler.address, baseId);

      await token.transferOwnership(handler.address);
    });

    describe("withdraw", () => {
      it("should should check correct metadata (1)", async () => {
        await handler.depositERC721(token.address, baseId, "receiver", "kovan", true);
        await handler.withdrawERC721(token.address, baseId, OWNER, "123", true);

        assert.equal(await token.tokenURI(baseId), tokenURI + "123");
      });

      it("should should check correct metadata (2)", async () => {
        await handler.depositERC721(token.address, baseId, "receiver", "kovan", true);
        await handler.withdrawERC721(token.address, baseId, OWNER, "", true);

        assert.equal(await token.tokenURI(baseId), tokenURI + baseId);
      });
    });
  });
});
