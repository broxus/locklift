const vm = require("vm");
const fs = require('fs');
const path = require('path');
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
    .option(
        '--disable-include-path',
        'Disables including node_modules. Use this with old compiler versions',
        false
    )
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
  
      process.exit(1);
    }
    
    if (options.disableBuild !== true) {
      utils.initializeDirIfNotExist(options.build);
  
      const builder = new utils.Builder(config, options);
  
      const status = builder.buildContracts();
  
      if (status === false) process.exit(1);
    }
  
    // Initialize Locklift
    const locklift = new Locklift(
      config,
      options.network
    );
  
    await locklift.setup();
  
    global.locklift = locklift;
    global.__dirname = __dirname;
    
    global.require = (p) => {
      const script = options.script.split('/');
      script.pop();
      
      return p.startsWith('.')
        ? require(path.resolve(process.cwd(), script.join('/'), p))
        : require(p);
    };
    
    const scriptCode = fs.readFileSync(options.script);
    const script = new vm.Script(scriptCode.toString());
    script.runInThisContext();
  });


module.exports = program;
