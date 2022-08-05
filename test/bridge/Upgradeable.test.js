const { toBN, accounts, wei } = require("../../scripts/helpers/utils");
const truffleAssert = require("truffle-assertions");

const ERC1967Proxy = artifacts.require("ERC1967ProxyMock");
const Bridge = artifacts.require("Bridge");

Bridge.numberFormat = "BigNumber";
ERC1967Proxy.numberFormat = "BigNumber";

describe("Upgradeable", () => {
  let bridge;
  let newBridge;
  let proxy;
  let proxyBridge;

  beforeEach("setup", async () => {
    bridge = await Bridge.new();
    newBridge = await Bridge.new();
    proxy = await ERC1967Proxy.new(bridge.address, []);
    proxyBridge = await Bridge.at(proxy.address);

    await proxyBridge.__Bridge_init([], "1");
  });

  it("should upgrade implementation", async () => {
    await truffleAssert.passes(proxyBridge.upgradeTo(newBridge.address));
  });

  it("should revert when call from non owner address", async () => {
    await truffleAssert.reverts(
      proxyBridge.upgradeTo(newBridge.address, { from: await accounts(1) }),
      "Ownable: caller is not the owner"
    );
  });
});
