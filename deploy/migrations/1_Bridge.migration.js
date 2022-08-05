const { logTransaction } = require("../runners/logger/logger.js");

const Bridge = artifacts.require("Bridge");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");

// TODO change parameters
const OWNER = "0x53638975BC11de3029E46DF193d64879EAeA94eB";
const validators = ["0x53638975BC11de3029E46DF193d64879EAeA94eB"];
const threshold = 1;

module.exports = async (deployer) => {
  const bridge = await deployer.deploy(Bridge);
  const proxy = await deployer.deploy(ERC1967Proxy, bridge.address, []);

  const bridgeProxy = await Bridge.at(proxy.address);

  logTransaction(await bridgeProxy.__Bridge_init(validators, threshold), "Init Bridge");
  logTransaction(await bridgeProxy.transferOwnership(OWNER), "Transfer ownership");
};
