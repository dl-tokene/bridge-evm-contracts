const { logTransaction } = require("../runners/logger/logger.js");

const Bridge = artifacts.require("Bridge");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");

const OWNER = process.env.BRIDGE_OWNER;
const validators = process.env.BRIDGE_VALIDATORS.split(",");
const threshold = parseInt(process.env.BRIDGE_THRESHHOLD, 10);

module.exports = async (deployer) => {
  const bridge = await deployer.deploy(Bridge);
  const proxy = await deployer.deploy(ERC1967Proxy, bridge.address, []);

  const bridgeProxy = await Bridge.at(proxy.address);

  logTransaction(await bridgeProxy.__Bridge_init(validators, threshold), "Init Bridge");
  logTransaction(await bridgeProxy.transferOwnership(OWNER), "Transfer ownership");
};
