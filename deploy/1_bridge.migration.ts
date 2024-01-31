import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import { Bridge__factory, ERC1967Proxy__factory } from "@ethers-v6";

const OWNER = process.env.BRIDGE_OWNER!;
const validators = process.env.BRIDGE_VALIDATORS!.split(",");
const threshold = parseInt(process.env.BRIDGE_THRESHHOLD!, 10);

export = async (deployer: Deployer) => {
  const bridgeImplementation = await deployer.deploy(Bridge__factory);
  const proxy = await deployer.deploy(ERC1967Proxy__factory, [
    await bridgeImplementation.getAddress(),
    bridgeImplementation.interface.encodeFunctionData("__Bridge_init", [validators, threshold]),
  ]);

  const bridge = await deployer.deployed(Bridge__factory, await proxy.getAddress());

  await bridge.transferOwnership(OWNER);

  Reporter.reportContracts(
    ["Bridge Implementation", await bridgeImplementation.getAddress()],
    ["Bridge Proxy", await proxy.getAddress()],
  );
};
