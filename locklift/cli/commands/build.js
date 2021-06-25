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
  .requiredOption(
    '--config <config>',
    'Path to the config file',
    async (config) => loadConfig(config),
  )
  .action(async (options) => {
    const config = await options.config;
    
    if (!fs.existsSync(options.build)) {
      console.debug(`Initialized empty ${options.build}`);
      fs.mkdirSync(options.build);
    }
    
    const buildStatus = utils.buildContracts(config, options);
  
    if (buildStatus === false) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  });


module.exports = program;
