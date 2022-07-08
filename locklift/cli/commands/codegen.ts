import { Command } from 'commander';
import { loadConfig } from '../../config';
import * as utils from '../utils';

const program = new Command();


program
  .name('codegen')
  .description('Generate contracts wrappers from abi')
  .option('-p, --path <path>', 'Path to folder with abi', '.')
  .option('-o, --output <output>', 'Path to the output folder', utils.Codegen.DEFAULT_OUTPUT_FOLDER)
  .requiredOption(
    '--config <config>',
    'Path to the config file',
    async (config) => loadConfig(config),
  )
  .action(async (options) => {
    const config = await options.config;

    const codegen = new utils.Codegen(config, options);

    const status = codegen.build();

    if (status === false) process.exit(1);

    process.exit(0);
  });

export default program;
