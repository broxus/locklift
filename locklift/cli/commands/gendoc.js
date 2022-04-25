const { Command, Option } = require("commander");

const { loadConfig } = require("./../../config");
const utils = require("./../utils");
const env = utils.env;
const program = new Command();

program
  .name("gendoc")
  .description(
    "Generate smart contracts documentation from the natspec comments",
  )
  .option(
    "-c, --contracts <contracts>",
    "Path to the contracts folder",
    "contracts",
  )
  .option("-b, --build <build>", "Path to the build folder", "build")
  .option(
    "--disable-include-path",
    "Disables including node_modules. Use this with old compiler versions",
    false,
  )
  .option("-d, --docs <docs>", "Path to the docs folder", "docs")
  .option(
    "-i, --include <include>",
    "Generate docs only for contracts, whose name matches the patters",
    ".*",
  )
  .addOption(
    new Option("-m, --mode <mode>", "Mode for compiler doc generator")
      .default("devdoc")
      .choices(["devdoc", "userdoc"]),
  )
  .option("--config <config>", "Path to the config file", async config =>
    loadConfig(config),
  )
  .action(async options => {
    let config = await options.config;

    if (config === undefined) {
      config = await loadConfig(`${env.rootDir}/locklift.config.js`);
    }

    utils.initializeDirIfNotExist(options.build);
    utils.initializeDirIfNotExist(options.docs);

    const builder = new utils.Builder(config, options);

    try {
      const status = builder.buildDocs();

      if (status === false) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    } catch (e) {
      console.log(e);
    }
  });

module.exports = program;
