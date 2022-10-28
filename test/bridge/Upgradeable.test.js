const { accounts, wei } = require("../../scripts/utils/utils");
const truffleAssert = require("truffle-assertions");

const ERC1967Proxy = artifacts.require("ERC1967ProxyMock");
const Bridge = artifacts.require("Bridge");

Bridge.numberFormat = "BigNumber";
ERC1967Proxy.numberFormat = "BigNumber";

describe("Upgradeable", () => {
  let OWNER;
  let SECOND;

  let bridge;
  let newBridge;
  let proxy;
  let proxyBridge;

  before("setup", async () => {
    OWNER = await accounts(0);
    SECOND = await accounts(1);
  });

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
      proxyBridge.upgradeTo(newBridge.address, { from: SECOND }),
      "Ownable: caller is not the owner"
    );
  });

  it("should receive ether through proxy", async () => {
    await truffleAssert.passes(
      await web3.eth.sendTransaction({ from: OWNER, to: proxyBridge.address, value: wei("1") }),
      "pass"
    );
  });
});
