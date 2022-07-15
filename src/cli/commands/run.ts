import path from "path";
import { Command, Option } from "commander";
import "ts-node";
import { loadConfig } from "../../config";
import { Locklift } from "../../index";
import { Builder } from "../builder";
import fs from "fs-extra";
import * as tsNode from "ts-node";
import { compilerConfigResolver } from "../builder/utils";

const program = new Command();

program
  .name("run")
  .description("Run arbitrary locklift script")
  .option("--disable-build", "Disable automatic contracts build", false)
  .option("-c, --contracts <contracts>", "Path to the contracts folder", "contracts")
  .option("-b, --build <build>", "Path to the build folder", "build")
  .option("--disable-include-path", "Disables including node_modules. Use this with old compiler versions", false)

  .requiredOption("-n, --network <network>", "Network to use, choose from configuration")
  .addOption(
    new Option("--config <config>", "Path to the config file")
      .default(() => loadConfig("locklift.config.ts"))
      .argParser(async config => () => loadConfig(config)),
  )
  .requiredOption("-s, --script <script>", "Script to run")
  .allowUnknownOption()
  .action(async options => {
    const config = await options.config();

    if (config.networks[options.network] === undefined) {
      console.error(`Can't find configuration for ${options.network} network!`);

      process.exit(1);
    }

    if (options.disableBuild !== true) {
      fs.ensureDirSync(options.build);

      const builder = new Builder(await compilerConfigResolver(config), options);

      const status = await builder.buildContracts();

      if (!status) process.exit(1);
    }

    // Initialize Locklift
    const locklift = await Locklift.setup(config, options.network);

    //@ts-ignore
    global.locklift = locklift;
    global.__dirname = __dirname;
    process.env.TS_CONFIG_PATHS = path.resolve(process.cwd(), "tsconfig.json");
    if (process.env.TS_CONFIG_PATHS) {
      require("tsconfig-paths/register");
    }
    await tsNode.register({
      project: process.env.TS_CONFIG_PATHS,
      files: false,
      transpileOnly: true,
    });
    require(path.resolve(process.cwd(), options.script));
  });

export default program;
