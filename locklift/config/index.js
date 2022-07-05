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
  boolean,
} = require("superstruct");

const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
const { stringify } = require("querystring");
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
  network: string(),
  compiler: Compiler,
  linker: Linker,
  networks: record(string(), Network),
  disableBuild: boolean(),
});

async function loadConfig(configPath) {
  const resolvedConfigPath = path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(resolvedConfigPath)) {
    throw new commander.InvalidOptionArgumentError(
      `Config at ${configPath} not found!`,
    );
  }

  const configFile = require(resolvedConfigPath);

  const client = new TonClient();
  let keys = configFile.networks[configFile.network].keys;

  if (keys.phrase === "") {
    const phrase = await client.crypto.mnemonic_from_random({
      dictionary: 1,
      word_count: 12,
    });

    keys.phrase = phrase.phrase;
  }

  configFile.networks[configFile.network].keys = {
    phrase: keys.phrase,
    amount: 12,
  };

  const config = create(configFile, Config);

  return config;
}

module.exports = {
  loadConfig,
};
