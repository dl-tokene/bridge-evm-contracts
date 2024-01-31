import { expect } from "chai";
import { ethers } from "hardhat";

import { Reverter } from "@test-helpers";

import { HashesMock } from "@ethers-v6";

describe("Hashes", () => {
  const reverter = new Reverter();

  let hashes: HashesMock;

  before("setup", async () => {
    const Hashers = await ethers.getContractFactory("HashesMock");
    hashes = await Hashers.deploy();

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("checkAndUpdateHashes", () => {
    it("should call checkAndUpdateHashes", async () => {
      const txHash = "0xc4f46c912cc2a1f30891552ac72871ab0f0e977886852bdd5dccd221a595647d";
      const txNonce = "1794147";

      await hashes.checkAndUpdateHashes(txHash, txNonce);

      const hash = ethers.keccak256(new ethers.AbiCoder().encode(["bytes32", "uint256"], [txHash, txNonce]));

      expect(await hashes.usedHashes(hash)).to.be.true;
      expect(await hashes.containsHash(txHash, txNonce)).to.be.true;
      expect(await hashes.containsHash(txHash, txNonce + 1)).to.be.false;
    });

    it("should revert when try add hash twice", async () => {
      const txHash = "0xc4f46c912cc2a1f30891552ac72871ab0f0e977886852bdd5dccd221a595647d";
      const txNonce = "1794147";

      await hashes.checkAndUpdateHashes(txHash, txNonce);

      await expect(hashes.checkAndUpdateHashes(txHash, txNonce)).to.be.rejectedWith("Hashes: the hash nonce is used");
    });
  });
});
