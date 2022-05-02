const { Command } = require("commander");
const { Locklift } = require("../../index");
const { loadConfig } = require("../../config");

const program = new Command();

program
  .name("showCode")
  .description("Show code contract")
  .requiredOption("-cn, --contract_name <contract_name>", "Contract name")
  .option("--config <config>", "Path to the config file", async config =>
    loadConfig(config),
  )
  .action(async options => {
    let config = await options.config;

    if (config === undefined) {
      config = await loadConfig(`${process.cwd()}/locklift.config.js`);
    }
    if (options.network === undefined) {
      options.network = config.network;
    }

    if (config.networks[options.network] === undefined) {
      console.error(`Can't find configuration for ${options.network} network!`);

      process.exit(1);
    }
    options.contract_name =
      options.contract_name || "CreditTokenTransferEthereumEvent";

    const locklift = new Locklift(config, options.network);
    await locklift.setup();
    const Contract = await locklift.factory.getContract(options.contract_name);

    console.log(`${options.contract_name} code:`);
    console.log(`${Contract.code}`);
    process.exit();
  });

module.exports = program;
