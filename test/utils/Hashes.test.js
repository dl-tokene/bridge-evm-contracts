const { assert } = require("chai");
const { toBN, accounts, wei } = require("../../scripts/helpers/utils");
const truffleAssert = require("truffle-assertions");
const { artifacts, web3 } = require("hardhat");

const Hashes = artifacts.require("HashesMock");

Hashes.numberFormat = "BigNumber";

describe("Hashes", () => {
  let hashes;

  beforeEach("setup", async () => {
    hashes = await Hashes.new();
  });

  describe("checkAndUpdateHashes", () => {
    it("should call checkAndUpdateHashes", async () => {
      let txHash = "0xc4f46c912cc2a1f30891552ac72871ab0f0e977886852bdd5dccd221a595647d";
      let txNonce = "1794147";

      await hashes.checkAndUpdateHashes(txHash, txNonce);

      let hash = web3.utils.soliditySha3({ value: txHash, type: "bytes32" }, { value: txNonce, type: "uint256" });

      assert.isTrue(await hashes.usedHashes(hash));
    });

    it("should revert when try add hash twice", async () => {
      let txHash = "0xc4f46c912cc2a1f30891552ac72871ab0f0e977886852bdd5dccd221a595647d";
      let txNonce = "1794147";

      await hashes.checkAndUpdateHashes(txHash, txNonce);

      await truffleAssert.reverts(hashes.checkAndUpdateHashes(txHash, txNonce), "Hashes: the hash nonce is used");
    });
  });
});
