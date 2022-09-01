const { logTransaction } = require("../runners/logger/logger.js");

const Bridge = artifacts.require("Bridge");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");

// TODO change parameters
const OWNER = "0x731eA4FC202700A31f4C7355F4a2eE1fa30B2DbE";
const validators = [];
const threshold = 1;

module.exports = async (deployer) => {
  const bridge = await deployer.deploy(Bridge);
  const proxy = await deployer.deploy(ERC1967Proxy, bridge.address, []);

  const bridgeProxy = await Bridge.at(proxy.address);

  logTransaction(await bridgeProxy.__Bridge_init(validators, threshold), "Init Bridge");
  logTransaction(await bridgeProxy.transferOwnership(OWNER), "Transfer ownership");
};
