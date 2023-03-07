import { Command, Option } from "commander";
import "ts-node";
import { loadConfig } from "../../config";

import { initLockliftStep } from "../steps/initLocklift";

const program = new Command();

program
  .name("code")
  .description("Print contract code")
  .requiredOption("-c --contract <contract>", "Contract name")
  .option("-b, --build <build>", "Path to the build folder", "build")

  .addOption(
    new Option("--config <config>", "Path to the config file")
      .default(() => loadConfig("locklift.config.ts"))
      .argParser(config => () => loadConfig(config)),
  )
  .action(async options => {
    const config = options.config();

    const locklift = await initLockliftStep(config, options);
    const { code } = locklift.factory.getContractArtifacts(options.contract);
    console.log(code);
  });

export default program;
