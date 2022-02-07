const { Command } = require('commander');
const fs = require('fs');

const { loadConfig } = require('./../../config');
const utils = require('./../utils');

const program = new Command();


program
  .name('build')
  .description('Build contracts by using TON Solidity compiler and TVM linker')
  .option('-c, --contracts <contracts>', 'Path to the contracts folder', 'contracts')
  .option('-b, --build <build>', 'Path to the build folder', 'build')
  .option(
      '--disable-include-path',
      'Disables including node_modules. Use this with old compiler versions',
      false
  )
  .requiredOption(
    '--config <config>',
    'Path to the config file',
    async (config) => loadConfig(config),
  )
  .action(async (options) => {
    const config = await options.config;

    utils.initializeDirIfNotExist(options.build);
    
    const builder = new utils.Builder(config, options);
    
    const status = builder.buildContracts();
    
    if (status === false) process.exit(1);
  
    process.exit(0);
  });


module.exports = program;
