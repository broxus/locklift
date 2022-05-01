const { Command, Option } = require("commander");

const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
TonClient.useBinaryLibrary(libNode);
const fs = require("fs-extra");
const { Locklift } = require("../../index");
const utils = require("../utils");
const { loadConfig } = require("./../../config");
const env = utils.env;
const program = new Command();

const Utils = require("../../utils/index");
program
  .name("deployAccount")
  .description("Deploy account")
  .option(
    "-n, --network <network>",
    "Network to use, choose from configuration",
    undefined,
  )
  .option("-k, --key-number <count>", "Key number", 0)
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
    await locklift.utils.deployAccount(
      options.keyNumber,
      options.balance,
      options.build,
    );
    process.exit();
  });

module.exports = program;
