const { Command } = require("commander");

const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
TonClient.useBinaryLibrary(libNode);
const { Locklift } = require("../../index");
const utils = require("../utils");
const { loadConfig } = require("../../config");
const program = new Command();

const Utils = require("../../utils/index");
program
  .name("getBalance")
  .description("Get balance of account")
  .option(
    "-n, --network <network>",
    "Network to use, choose from configuration",
    undefined,
  )
  .requiredOption("-a, --address <address>", "Requested address account")
  .option("--config <config>", "Path to the config file", async config =>
    loadConfig(config),
  )
  .option("--convert", "Convert from precision", false)
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
      .getBalance(options.address, options.convert)
      .then(balance => console.log(balance))
      .catch(err => console.log(err));
    process.exit();
  });

module.exports = program;
