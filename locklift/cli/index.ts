#!/usr/bin/env node

import { program } from 'commander';

import init from './commands/init';
import build from './commands/build';
import test from './commands/test';
import run from './commands/run';
import gendoc from './commands/gendoc';


program.addCommand(init);
program.addCommand(build);
program.addCommand(test);
program.addCommand(run);
program.addCommand(gendoc);

program.version(require('../../package.json').version);

program.parse(process.argv);
