const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const commander = require("commander");
const {
  object,
  string,
  defaulted,
  create,
  any,
  integer,
  record,
} = require("superstruct");

const env = JSON.parse(require("../config/env.json"));

const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
TonClient.useBinaryLibrary(libNode);

const Compiler = object({
  path: defaulted(string(), () => "/usr/bin/solc-ton"),
});

const Linker = object({
  path: defaulted(string(), () => "/usr/bin/tvm_linker"),
  lib: any(),
});

const Giver = object({
  address: string(),
  abi: object(),
  key: string(),
});

const Keys = object({
  phrase: string(),
  amount: defaulted(integer(), () => 25),
  path: defaulted(string(), () => "m/44'/396'/0'/0/INDEX"),
});

const Network = object({
  ton_client: any(),
  giver: Giver,
  keys: Keys,
});

const Config = object({
  compiler: Compiler,
  linker: Linker,
  networks: record(string(), Network),
});

async function loadConfig(configPath) {
  const resolvedConfigPath = path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(resolvedConfigPath)) {
    if (env.initialized) {
      throw new commander.InvalidOptionArgumentError(
        `Config at ${configPath} not found!`,
      );
    } else return;
  }

  const configFile = require(resolvedConfigPath);

  const config = create(configFile, Config);

  const client = new TonClient();

  config.networks = await Object.entries(config.networks).reduce(
    async (accP, [network, networkConfig]) => {
      const acc = await accP;

      const keys = require(`${env.rootDir}/keys.json`);

      if (keys.mnemonic === "") {
        const phrase = await client.crypto.mnemonic_from_random({
          dictionary: 1,
          word_count: 12,
        });

        keys.mnemonic = phrase.phrase;

        fse.writeJSON(`${env.rootDir}/keys.json`, JSON.stringify(keys), err => {
          if (err) {
            throw err;
          }
        });

        console.log(
          `A new mnemonic phrase has been generated in ${env.rootDir}/keys.json`,
        );
      }

      return {
        ...acc,
        [network]: networkConfig,
      };
    },
    Promise.resolve({}),
  );

  return config;
}

module.exports = {
  loadConfig,
};
