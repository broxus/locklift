const { Command } = require("commander");

const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
TonClient.useBinaryLibrary(libNode);
const { Locklift } = require("../../index");
const { loadConfig } = require("./../../config");
const program = new Command();

program
  .name("deployAccount")
  .description("Deploy account")
  .option(
    "-n, --network <network>",
    "Network to use, choose from configuration",
    undefined,
  )
  .option(
    "-kn, --key-number <count>",
    "The key number from the keys obtained from \
    the specified mnemonic in keys.json and the HD path.",
    0,
  )
  .option("-b, --balance <amount>", "Initial balance. Only testnet.", 100)
  .option("--build <path>", "Path to the build folder", "build")
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
    const locklift = new Locklift(config, options.network);
    await locklift.setup();

    await locklift.utils
      .deployAccount({
        keyNumber: options.keyNumber,
        balance: options.balance,
        build: options.build,
      })
      .catch(err => console.log(err));
    process.exit();
  });

module.exports = program;
