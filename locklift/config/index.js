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

const Compiler = object({
  path: defaulted(string(), () => '/usr/bin/solc-ton'),
});

const Linker = object({
  path: defaulted(string(), () => '/usr/bin/tvm_linker'),
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


function loadConfig(configPath) {
  const resolvedConfigPath = path.resolve(process.cwd(), configPath);
  
  if (!fs.existsSync(resolvedConfigPath)) {
    throw new commander.InvalidOptionArgumentError(`Config at ${configPath} not found!`);
  }
  
  const config = require(resolvedConfigPath);
  
  return create(config, Config);
}


module.exports = {
  loadConfig,
};
