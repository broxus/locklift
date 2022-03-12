const fs = require('fs');
const path = require('path');
const commander = require('commander');
const {
  object,
  string,
  defaulted,
  create,
  any,
  integer,
  record
} = require('superstruct');

const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
TonClient.useBinaryLibrary(libNode);


const Compiler = object({
  path: defaulted(string(), () => '/usr/bin/solc-ton'),
});

const Linker = object({
  path: defaulted(string(), () => '/usr/bin/tvm_linker'),
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
  path: defaulted(string(), () => 'm/44\'/396\'/0\'/0/INDEX')
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
    throw new commander.InvalidOptionArgumentError(`Config at ${configPath} not found!`);
  }
  
  const configFile = require(resolvedConfigPath);
  
  const config = create(configFile, Config);
  
  // Ad hoc
  // Since superstruct not allows async default value, default mnemonic phrases are generated bellow
  function genHexString(len) {
    const str = Math.floor(Math.random() * Math.pow(16, len)).toString(16);
    return "0".repeat(len - str.length) + str;
  }

  const client = new TonClient();
  
  config.networks = await Object.entries(config.networks)
    .reduce(async (accP, [network, networkConfig]) => {
      const acc = await accP;

      if (networkConfig.keys.phrase === '') {
        const entropy = genHexString(32);
    
        const {
          phrase,
        } = await client.crypto.mnemonic_from_entropy({
          entropy,
          word_count: 12,
        });
    
        networkConfig.keys.phrase = phrase;
      }
      
      return {
        ...(acc),
        [network]: networkConfig
      }
    }, Promise.resolve({}));
  
  return config;
}


module.exports = {
  loadConfig,
};
