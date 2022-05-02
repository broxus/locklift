const { Command } = require("commander");

const { loadConfig } = require("./../../config");
const utils = require("./../utils");
const { Locklift } = require("../../index");
const program = new Command();
const env = utils.env;

program
  .name("transfer")
  .description("Transfer")
  .requiredOption("--to <address>", "Transfer recipient")
  .requiredOption(
    "-a, --amount <amount>",
    "Transfer amount multiplied by precision",
  )
  .option("--config <config>", "Path to the config file", async config =>
    loadConfig(config),
  )
  .option(
    "-kn, --key-number <address>",
    "The key number from the keys obtained from \
    the specified mnemonic in keys.json and the HD path.",
    0,
  )
  .option(
    "-n, --network <network>",
    "Network to use, choose from configuration",
    undefined,
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

    const locklift = new Locklift(config, options.network);
    await locklift.setup();
    const keyPairs = await locklift.keys.getKeyPairs();

    await locklift.utils.transfer({
      to: options.to,
      amount: options.amount,
      keyPair: keyPairs[options.keyNumber],
    });

    await process.exit(0);
  });

module.exports = program;
