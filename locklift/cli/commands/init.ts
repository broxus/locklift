import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import * as utils from './../utils';

const program = new Command();


program
  .name('init')
  .description('Initialize sample Locklift project in a directory')
  .requiredOption(
    '-p, --path <path>',
    'Path to the project folder',
    '.'
  )
  .option(
    '-f, --force',
    'Ignore non-empty path',
    false,
  )
  .option(
    '-ts, --typescript',
    'Initialize typescript project',
    false,
  )
  .action((options) => {
    const pathEmpty = utils.checkDirEmpty(options.path);

    if (!pathEmpty && options.force === false) {
      console.error(`Directory at ${options.path} should be empty!`);
      return;
    }

    const smapleProjectRelativePath = options.typescript
      ? './../../../../sample-project-typescript'
      : './../../../../sample-project'
    const sampleProjectPath = path.resolve(__dirname, smapleProjectRelativePath);

    fs.copy(sampleProjectPath, options.path, (err: Error) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(`New Locklift project initialized in ${options.path}`);
    });
  });

export default program;
