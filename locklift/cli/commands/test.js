const { Command } = require('commander');
const Mocha = require('mocha');
const fs = require('fs');
const path = require('path');
const dirTree = require("directory-tree");

const { loadConfig } = require('./../../config');
const { Locklift } = require('./../../index');
const utils = require('./../utils');

const program = new Command();


program
  .name('test')
  .description('Run mocha tests')
  .option('-t, --test <test>', 'Path to Mocha test folder', 'test')
  .requiredOption(
    '-n, --network <network>',
    'Network to use, choose from configuration'
  )
  .requiredOption(
    '--config <config>',
    'Path to the config file',
    async (config) => loadConfig(config),
  )
  .action(async (options) => {
    const config = await options.config;
    
    if (config.networks[options.network] === undefined) {
      console.error(`Can't find configuration for ${options.network} network!`);
      
      return;
    }
    
    // Initialize Locklift and pass it into tests context
    const locklift = new Locklift(
      config,
      options.network
    );
    
    await locklift.setup();
    
    global.locklift = locklift;
  
    // Run mocha tests
    const mocha = new Mocha();
  
    const testNestedTree = dirTree(
      path.resolve(process.cwd(), options.test),
      { extensions: /\.js/ }
    );
  
    const testTree = utils.flatDirTree(testNestedTree);
  
    testTree.forEach((file) => mocha.addFile(file.path));
    mocha.run((fail) => process.exit(fail ? 1 : 0));
  });


module.exports = program;
