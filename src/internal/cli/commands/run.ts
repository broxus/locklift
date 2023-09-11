import { Command, Option } from "commander";
import "ts-node";
import { loadConfig, LOCKLIFT_NETWORK_NAME } from "../../config";

import { buildStep } from "../steps/build";
import { initLockliftStep } from "../steps/initLocklift";
import path from "path";

const program = new Command();

program
  .name("run")
  .description("Run arbitrary locklift script")
  .option("--disable-build", "Disable automatic contracts build", false)
  .option("-c, --contracts <contracts>", "Path to the contracts folder", "contracts")
  .option("-b, --build <build>", "Path to the build folder", "build")
  .option("-f, --force", "Force build contracts", false)

  .option("--disable-include-path", "Disables including node_modules. Use this with old compiler versions", false)
  .option("-p, --params [value...]", "Parameters to pass to the script")
  .option("-n, --network <network>", "Network to use, choose from configuration", LOCKLIFT_NETWORK_NAME)
  .addOption(
    new Option("--config <config>", "Path to the config file")
      .default(() => loadConfig("locklift.config.ts"))
      .argParser(config => () => loadConfig(config)),
  )
  .requiredOption("-s, --script <script>", "Script to run")
  .allowUnknownOption()
  .action(async options => {
    const config = options.config();

    if (config.networks[options.network] === undefined) {
      console.error(`Can't find configuration for ${options.network} network!`);

      process.exit(1);
    }
    if (!options.disableBuild) {
      await buildStep(config, options, config.force);
    }
    // Initialize Locklift
    await initLockliftStep(config, options);
    const scriptContent = require(path.resolve(process.cwd(), options.script));
    if (scriptContent.default) {
      await scriptContent
        .default(...options.params)
        .then(() => process.exit(0))
        .catch((e: any) => {
          console.log(e);
          process.exit(1);
        });
    }
  });

export default program;
