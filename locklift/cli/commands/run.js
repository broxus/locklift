const vm = require("vm");
const fs = require('fs');
const { Command } = require('commander');

const { loadConfig } = require('./../../config');
const { Locklift } = require('./../../index');
const utils = require('./../utils');

const program = new Command();


program
  .name('run')
  .description('Run arbitrary locklift script')
  .option('--disable-build', 'Disable automatic contracts build', false)
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
  .requiredOption(
    '-s, --script <script>',
    'Script to run'
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
  
    // Initialize Locklift
    const locklift = new Locklift(
      config,
      options.network
    );
  
    await locklift.setup();
  
    global.locklift = locklift;
    global.require = require;
    
    const scriptCode = fs.readFileSync(options.script);
    const script = new vm.Script(scriptCode.toString());
    script.runInThisContext();
  });


module.exports = program;
