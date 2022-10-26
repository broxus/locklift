import { Command, Option } from "commander";

import { loadConfig } from "../../config";
import { Builder } from "../builder";
import fs from "fs-extra";
import { compilerConfigResolver } from "../builder/utils";
import { logger } from "../../logger";

const program = new Command();

program
  .name("gendoc")
  .description("Generate smart contracts documentation from the natspec comments")
  .option("-c, --contracts <contracts>", "Path to the contracts folder", "contracts")
  .option("-b, --build <build>", "Path to the build folder", "build")
  .option("--disable-include-path", "Disables including node_modules. Use this with old compiler versions", false)
  .option("-d, --docs <docs>", "Path to the docs folder", "docs")
  .option("-i, --include <include>", "Generate docs only for contracts, whose name matches the patters", ".*")
  .addOption(
    new Option("-m, --mode <mode>", "Mode for compiler doc generator").default("devdoc").choices(["devdoc", "userdoc"]),
  )
  .addOption(
    new Option("--config <config>", "Path to the config file")
      .default(() => loadConfig("locklift.config.ts"))
      .argParser(async config => () => loadConfig(config)),
  )
  .action(async options => {
    const config = await options.config();

    fs.ensureDirSync(options.build);
    fs.ensureDirSync(options.docs);

    const builder = new Builder(await compilerConfigResolver(config), options);

    try {
      const status = builder.buildDocs();

      if (!status) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    } catch (e) {
      logger.printError(e);
    }
  });

export default program;
