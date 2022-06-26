import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import childProcess from 'child_process';
import * as utils from './../utils';

const program = new Command();


program
  .name('init')
  .description('Initialize sample Locklift project in a directory')
  .option(
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
  .option(
    '-i, --installDeps',
    'Install required dependencies',
    false,
  )
  .action((options) => {
    const pathEmpty = utils.checkDirEmpty(options.path);

    if (!pathEmpty && options.force === false) {
      console.error(`Directory at ${options.path} should be empty!`);
      return;
    }

    const smapleProjectRelativePath = options.typescript
      ? './../../../sample-project-typescript'
      : './../../../sample-project'
    const sampleProjectPath = path.resolve(__dirname, smapleProjectRelativePath);

    fs.copy(sampleProjectPath, options.path, (err: Error) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(`New Locklift ${options.typescript ? 'typescript' : ''} project initialized in ${options.path}`);
    });

    if (options.installDeps) {
      if (!options.typescript) {
        console.log('Install required dependencies is available for typescript project only');
        return;
      }

      console.log('Installing required dependencies...');

      if (options.path) {
        childProcess.execSync(`cd ${options.path}`);
      }

      childProcess.execSync('npm i --save-dev typescript @types/chai @types/mocha @types/node');
    } else if (options.typescript) {
      console.log('You have to install the following dependencies by yourself: npm i --save-dev typescript @types/chai @types/mocha @types/node');
    }
  });

export default program;
