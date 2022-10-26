import { Command, Option } from "commander";
import { loadConfig } from "../../config";

import fs from "fs-extra";
import { Builder } from "../builder";
import { compilerConfigResolver } from "../builder/utils";

const program = new Command();

program
  .name("build")
  .description("Build contracts by using Ever Solidity compiler and TVM linker")
  .option("-c, --contracts <contracts>", "Path to the contracts folder", "contracts")
  .option("-b, --build <build>", "Path to the build folder", "build")
  .option("--disable-include-path", "Disables including node_modules. Use this with old compiler versions", false)
  .addOption(
    new Option("--config <config>", "Path to the config file")
      .default(async () => loadConfig("locklift.config.ts"))
      .argParser(config => () => loadConfig(config)),
  )
  .action(async options => {
    const config = await options.config();

    fs.ensureDirSync(options.build);

    const builder = new Builder(await compilerConfigResolver(config), options);

    const status = await builder.buildContracts();

    if (!status) process.exit(1);

    process.exit(0);
  });

export default program;
