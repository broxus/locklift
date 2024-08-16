import { Command, Option } from "commander";
import "ts-node";
import { loadConfig, LOCKLIFT_NETWORK_NAME } from "../../config";

import { initLockliftStep } from "../steps/initLocklift";
import { Address } from "everscale-inpage-provider";

const program = new Command();

program
  .name("fee")
  .description("Print storage fee for the given contract and period of time")
  .requiredOption("-a --address <address>", "Contract address")
  .option("-t --time <time>", "Time in seconds, default is one year", (365 * 24 * 60 * 60).toString())
  .option("-m --masterChain <masterChain>", "Is master chain")
  .option("-n, --network <network>", "Network to use, choose from configuration", LOCKLIFT_NETWORK_NAME)

  .addOption(
    new Option("--config <config>", "Path to the config file")
      .default(() => loadConfig("locklift.config.ts"))
      .argParser(config => () => loadConfig(config)),
  )
  .action(async options => {
    const DUMMY_ABI = {
      "ABI version": 2,
      version: "2.2",
      header: [],
      functions: [],
      events: [],
      fields: [
        {
          name: "paramsRoot",
          type: "cell",
        },
      ],
    } as const;
    const config = options.config();

    const locklift = await initLockliftStep(config, options);
    const contractAddress = new Address(options.address);
    const contractState = await new locklift.provider.Contract(DUMMY_ABI, contractAddress)
      .getFullState()
      .then(res => res.state);
    if (!contractState) {
      console.error(`Can't find contract with address ${contractAddress.toString()}`);
      process.exit(1);
    }
    const res = await locklift.provider.computeStorageFee({
      state: contractState,
      timestamp: Date.now() / 1000 + Number(options.time),
      masterchain: !!options.masterChain,
    });
    console.log(res);
  });

export default program;
