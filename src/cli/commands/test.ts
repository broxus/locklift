import { Command, Option } from "commander";
import Mocha from "mocha";
import "ts-mocha";
import path from "path";
import dirTree from "directory-tree";

import { loadConfig } from "../../config";
import { Locklift } from "../../index";
import * as utils from "../builder/utils";
import { Builder } from "../builder";
import { compilerConfigResolver } from "../builder/utils";
import fs from "fs-extra";

const program = new Command();

program
  .name("test")
  .description("Run mocha tests")
  .option("--disable-build", "Disable automatic contracts build", false)
  .option("-t, --test <test>", "Path to Mocha test folder", "test")
  .option("-c, --contracts <contracts>", "Path to the contracts folder", "contracts")
  .option("-b, --build <build>", "Path to the build folder", "build")
  .option("--disable-include-path", "Disables including node_modules. Use this with old compiler versions", false)
  .requiredOption("-n, --network <network>", "Network to use, choose from configuration")
  .addOption(
    new Option("--config <config>", "Path to the config file")
      .default(async () => loadConfig("locklift.config.ts"))
      .argParser(async config => () => loadConfig(config)),
  )
  .option("--tests [tests...]", "Set of tests to run, separated by comma")
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
    // Initialize Locklift and pass it into tests context
    const locklift = await Locklift.setup(config, options.network);

    //@ts-ignore
    global.locklift = locklift;

    // Run mocha tests
    if (config.mocha?.tsconfig) {
      process.env.TS_NODE_PROJECT = config.mocha?.tsconfig;
      process.env.TS_CONFIG_PATHS = "true";
    }
    const mocha = new Mocha({ ...config.mocha });

    // Run all .js files in tests or only specified tests
    let testFiles: string[];

    if (Array.isArray(options.tests)) {
      testFiles = options.tests;
    } else {
      const testNestedTree = dirTree(path.resolve(process.cwd(), options.test), { extensions: /\.(js|ts)/ });

      testFiles = utils.flatDirTree(testNestedTree)?.map(t => t.path) || [];
    }
    testFiles.forEach((file: string) => mocha.addFile(file));
    mocha.run(fail => process.exit(fail ? 1 : 0));
  });

export default program;
