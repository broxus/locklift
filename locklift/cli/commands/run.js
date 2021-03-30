const vm = require("vm");
const fs = require('fs');
const { Command } = require('commander');

const { loadConfig } = require('./../../config');
const { Locklift } = require('./../../index');

const program = new Command();


program
  .name('run')
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
  .action(async (options) => {
    const config = await options.config;

    if (config.networks[options.network] === undefined) {
      console.error(`Can't find configuration for ${options.network} network!`);
    
      return;
    }
    
    // Initialize Locklift
    const locklift = new Locklift(
      config,
      options.network
    );
  
    await locklift.setup();
  
    global.locklift = locklift;
    
    const scriptCode = fs.readFileSync(options.script);
    const script = new vm.Script(scriptCode.toString());
    script.runInThisContext();
  });


module.exports = program;
