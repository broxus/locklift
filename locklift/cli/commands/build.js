const { Command } = require('commander');
const dirTree = require("directory-tree");
const fs = require('fs');
const { execSync } = require('child_process');

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

    const contractsNestedTree = dirTree(
      options.contracts,
      { extensions: /\.sol/ }
    );

    const contractsTree = utils.flatDirTree(contractsNestedTree);
  
    console.log(`Found ${contractsTree.length} sources`);
  
    if (!fs.existsSync(options.build)) {
      console.debug(`Initialized empty ${options.build}`);
      fs.mkdirSync(options.build);
    }
  
    try {
      contractsTree.map(({ path }) => {
        console.debug(`Building ${path}`);
      
        const [,contractFileName] = path.match(new RegExp('contracts/(.*).sol'));
      
        const output = execSync(`cd ${options.build} && ${config.compiler.path} ./../${path}`);
  
        console.debug(`Compiled ${path}`);
  
        if (output.toString() === '') {
          // No code was compiled, probably interface compilation
          return;
        }
        
        const contractNameNoFolderStructure = contractFileName.split('/')[contractFileName.split('/').length - 1];
      
        const tvmLinkerLog = execSync(`cd ${options.build} && ${config.linker.path} compile "${contractNameNoFolderStructure}.code" -a "${contractNameNoFolderStructure}.abi.json"`);

        const [,tvcFile] = tvmLinkerLog.toString().match(new RegExp('Saved contract to file (.*)'));
        execSync(`cd ${options.build} && base64 < ${tvcFile} > ${contractNameNoFolderStructure}.base64`);
      
        execSync(`cd ${options.build} && mv ${tvcFile} ${contractNameNoFolderStructure}.tvc`);
        
        console.debug(`Linked ${path}`);
      });
    } catch (e) {
    }
  
  });


module.exports = program;
