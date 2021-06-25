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
  .option('--disable-build', 'Disable automatic contracts build', false)
  .option('-t, --test <test>', 'Path to Mocha test folder', 'test')
  .option('-c, --contracts <contracts>', 'Path to the contracts folder', 'contracts')
  .option('-b, --build <build>', 'Path to the build folder', 'build')
  .requiredOption(
    '-n, --network <network>',
    'Network to use, choose from configuration'
  )
  .requiredOption(
    '--config <config>',
    'Path to the config file',
    async (config) => loadConfig(config),
  )
  .option(
    '--tests [tests...]',
    'Set of tests to run, separated by comma',
  )
  .allowUnknownOption()
  .action(async (options) => {
    const config = await options.config;
    
    if (config.networks[options.network] === undefined) {
      console.error(`Can't find configuration for ${options.network} network!`);
      
      return;
    }
    
    if (options.disableBuild !== true) {
      const buildStatus = utils.buildContracts(config, options);
  
      if (buildStatus === false) {
        process.exit(1);
      }
    }
  
    // Initialize Locklift and pass it into tests context
    const locklift = new Locklift(config, options.network);
    
    await locklift.setup();
    
    global.locklift = locklift;
  
    // Run mocha tests
    const mocha = new Mocha();

    
    // Run all .js files in tests or only specified tests
    let testFiles;
    
    if (Array.isArray(options.tests)) {
      testFiles = options.tests;
    } else {
      const testNestedTree = dirTree(
        path.resolve(process.cwd(), options.test),
        { extensions: /\.js/ }
      );
  
      testFiles = utils.flatDirTree(testNestedTree).map(t => t.path);
    }
    
    testFiles.forEach((file) => mocha.addFile(file));
    mocha.run((fail) => process.exit(fail ? 1 : 0));
  });


module.exports = program;
