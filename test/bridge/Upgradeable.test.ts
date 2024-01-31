import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { wei } from "@scripts";
import { Reverter } from "@test-helpers";

import { ERC1967Proxy, Bridge, Bridge__factory } from "@ethers-v6";

describe("Upgradeable", () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let SECOND: SignerWithAddress;

  let bridge: Bridge;
  let newBridge: Bridge;

  let proxy: ERC1967Proxy;
  let proxyBridge: Bridge;

  before("setup", async () => {
    [OWNER, SECOND] = await ethers.getSigners();

    const Bridge = await ethers.getContractFactory("Bridge");
    const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");

    bridge = await Bridge.deploy();
    newBridge = await Bridge.deploy();

    proxy = await ERC1967Proxy.deploy(await bridge.getAddress(), "0x");
    proxyBridge = Bridge__factory.connect(await proxy.getAddress(), OWNER);

    await proxyBridge.__Bridge_init([], "1");

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  it("should upgrade implementation", async () => {
    await expect(proxyBridge.upgradeTo(await newBridge.getAddress())).to.be.eventually.fulfilled;
  });

  it("should revert when call from non owner address", async () => {
    await expect(proxyBridge.connect(SECOND).upgradeTo(await newBridge.getAddress())).to.be.rejectedWith(
      "Ownable: caller is not the owner",
    );
  });

  it("should receive ether through proxy", async () => {
    await expect(
      OWNER.sendTransaction({
        to: await proxyBridge.getAddress(),
        value: wei("1"),
      }),
    ).to.be.eventually.fulfilled;
  });
});
