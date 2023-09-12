import { Command, Option } from "commander";
import { loadConfig } from "../../config";

import { buildStep } from "../steps/build";

const program = new Command();

program
  .name("build")
  .description("Build contracts by using Ever Solidity compiler and TVM linker")
  .option("-c, --contracts <contracts>", "Path to the contracts folder", "contracts")
  .option("-b, --build <build>", "Path to the build folder", "build")
  .option("-f, --force", "Force build contracts", false)
  .option("--disable-include-path", "Disables including node_modules. Use this with old compiler versions", false)
  .addOption(
    new Option("--config <config>", "Path to the config file")
      .default(async () => loadConfig("locklift.config.ts"))
      .argParser(config => () => loadConfig(config)),
  )
  .action(async options => {
    const config = await options.config();

    await buildStep(config, options, options.force);

    process.exit(0);
  });

export default program;
