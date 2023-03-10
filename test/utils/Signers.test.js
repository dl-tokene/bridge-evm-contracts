const { assert } = require("chai");
const { accounts } = require("../../scripts/utils/utils");
const truffleAssert = require("truffle-assertions");
const ethSigUtil = require("@metamask/eth-sig-util");

const Signers = artifacts.require("SignersMock");

Signers.numberFormat = "BigNumber";

const OWNER_PRIVATE_KEY = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const ANOTHER_PRIVATE_KEY = "df57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e";

describe("Signers", () => {
  let OWNER;
  let SECOND;
  let THIRD;

  let signers;

  before("setup", async () => {
    OWNER = await accounts(0);
    SECOND = await accounts(1);
    THIRD = await accounts(2);
  });

  beforeEach("setup", async () => {
    signers = await Signers.new();
    await signers.__SignersMock_init([OWNER], "1");
  });

  describe("access", () => {
    it("should not initialize twice", async () => {
      await truffleAssert.reverts(signers.__Signers_init([OWNER], "1"), "Initializable: contract is not initializing");
    });

    it("only owner should call these functions", async () => {
      await truffleAssert.reverts(
        signers.setSignaturesThreshold(1, { from: SECOND }),
        "Ownable: caller is not the owner"
      );
      await truffleAssert.reverts(signers.addSigners([OWNER], { from: SECOND }), "Ownable: caller is not the owner");
      await truffleAssert.reverts(signers.removeSigners([OWNER], { from: SECOND }), "Ownable: caller is not the owner");
    });
  });

  describe("setSignaturesThreshold", () => {
    it("should set signaturesThreshold", async () => {
      let expectedSignaturesThreshold = 1;

      await signers.setSignaturesThreshold(expectedSignaturesThreshold);

      assert.equal(expectedSignaturesThreshold, await signers.signaturesThreshold());
    });

    it("should revert when try to set signaturesThreshold to 0", async () => {
      let expectedSignaturesThreshold = 0;

      await truffleAssert.reverts(
        signers.setSignaturesThreshold(expectedSignaturesThreshold),
        "Signers: invalid threshold"
      );
    });
  });

  describe("addSigners", () => {
    it("should add signers", async () => {
      let expectedSigners = [OWNER, SECOND, THIRD];

      await signers.addSigners(expectedSigners);

      assert.deepEqual(expectedSigners, await signers.getSigners());
    });

    it("should revert when try add zero address signer", async () => {
      let expectedSigners = [OWNER, "0x0000000000000000000000000000000000000000", THIRD];

      await truffleAssert.reverts(signers.addSigners(expectedSigners), "Signers: zero signer");
    });
  });

  describe("removeSigners", () => {
    it("should remove signers", async () => {
      let signersToAdd = [OWNER, SECOND, THIRD];
      let signersToRemove = [OWNER, THIRD];

      await signers.addSigners(signersToAdd);
      await signers.removeSigners(signersToRemove);

      assert.deepEqual(await signers.getSigners(), [SECOND]);
    });
  });

  describe("checkSignatures", () => {
    let signersToAdd;

    beforeEach("", async () => {
      signersToAdd = [OWNER, SECOND, THIRD];
      await signers.addSigners(signersToAdd);
    });

    it("should check signatures", async () => {
      await signers.addSigners([await accounts(19)]);
      const privateKey = Buffer.from(OWNER_PRIVATE_KEY, "hex");
      const anotherPrivateKey = Buffer.from(ANOTHER_PRIVATE_KEY, "hex");

      let expectedTxHash = "0xc4f46c912cc2a1f30891552ac72871ab0f0e977886852bdd5dccd221a595647d";
      let expectedNonce = "1794147";

      let signHash = web3.utils.soliditySha3(
        { value: "0x76e98f7d84603AEb97cd1c89A80A9e914f181679", type: "address" },
        { value: "1", type: "uint256" },
        { value: OWNER, type: "address" },
        { value: expectedTxHash, type: "bytes32" },
        { value: expectedNonce, type: "uint256" },
        { value: "98", type: "uint256" },
        { value: true, type: "bool" }
      );

      let signature1 = ethSigUtil.personalSign({ privateKey: privateKey, data: signHash });
      let signature2 = ethSigUtil.personalSign({ privateKey: anotherPrivateKey, data: signHash });

      await truffleAssert.passes(signers.checkSignatures(signHash, [signature1, signature2]));
    });

    it("should revert when try duplicate signers", async () => {
      const privateKey = Buffer.from(OWNER_PRIVATE_KEY, "hex");
      let expectedTxHash = "0xc4f46c912cc2a1f30891552ac72871ab0f0e977886852bdd5dccd221a595647d";
      let expectedNonce = "1794147";

      let signHash = web3.utils.soliditySha3(
        { value: "0x76e98f7d84603AEb97cd1c89A80A9e914f181679", type: "address" },
        { value: "1", type: "uint256" },
        { value: OWNER, type: "address" },
        { value: expectedTxHash, type: "bytes32" },
        { value: expectedNonce, type: "uint256" },
        { value: "98", type: "uint256" },
        { value: true, type: "bool" }
      );

      let signature = ethSigUtil.personalSign({ privateKey: privateKey, data: signHash });

      await truffleAssert.reverts(
        signers.checkSignatures(signHash, [signature, signature]),
        "Signers: duplicate signers"
      );
    });

    it("should revert when try sign by not signer", async () => {
      const privateKey = Buffer.from(ANOTHER_PRIVATE_KEY, "hex");
      let expectedTxHash = "0xc4f46c912cc2a1f30891552ac72871ab0f0e977886852bdd5dccd221a595647d";
      let expectedNonce = "1794147";

      let signHash = web3.utils.soliditySha3(
        { value: "0x76e98f7d84603AEb97cd1c89A80A9e914f181679", type: "address" },
        { value: "1", type: "uint256" },
        { value: OWNER, type: "address" },
        { value: expectedTxHash, type: "bytes32" },
        { value: expectedNonce, type: "uint256" },
        { value: "98", type: "uint256" },
        { value: true, type: "bool" }
      );

      let signature = ethSigUtil.personalSign({ privateKey: privateKey, data: signHash });

      await truffleAssert.reverts(signers.checkSignatures(signHash, [signature]), "Signers: invalid signer");
    });

    it("should revert when try signers < threshold", async () => {
      await signers.setSignaturesThreshold(1);
      let expectedTxHash = "0xc4f46c912cc2a1f30891552ac72871ab0f0e977886852bdd5dccd221a595647d";
      let expectedNonce = "1794147";

      let signHash = web3.utils.soliditySha3(
        { value: "0x76e98f7d84603AEb97cd1c89A80A9e914f181679", type: "address" },
        { value: "1", type: "uint256" },
        { value: OWNER, type: "address" },
        { value: expectedTxHash, type: "bytes32" },
        { value: expectedNonce, type: "uint256" },
        { value: "98", type: "uint256" },
        { value: true, type: "bool" }
      );

      await truffleAssert.reverts(signers.checkSignatures(signHash, []), "Signers: threshold is not met");
    });

    it("should revert when pass incorrect", async () => {
      let expectedTxHash = "0xc4f46c912cc2a1f30891552ac72871ab0f0e977886852bdd5dccd221a595647d";
      let expectedNonce = "1794147";

      let signHash = web3.utils.soliditySha3(
        { value: "0x76e98f7d84603AEb97cd1c89A80A9e914f181679", type: "address" },
        { value: "1", type: "uint256" },
        { value: OWNER, type: "address" },
        { value: expectedTxHash, type: "bytes32" },
        { value: expectedNonce, type: "uint256" },
        { value: "98", type: "uint256" },
        { value: true, type: "bool" }
      );

      await truffleAssert.reverts(
        signers.checkSignatures(signHash, [expectedTxHash]),
        "ECDSA: invalid signature length"
      );
    });
  });
});
