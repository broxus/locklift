#!/usr/bin/env node
import * as path from "path";

process.env.TS_NODE_PROJECT = path.join(__dirname, "../../tsconfig.json");
process.env.TS_CONFIG_PATHS = "true";

import { program } from "commander";
import init from "./commands/init";
import build from "./commands/build";
import test from "./commands/test";
import run from "./commands/run";
import code from "./commands/getContractCode";

import { commandInjector } from "../../plugins/utils";
import { tryToAttachEntryFile } from "./utils";

const main = async () => {
  global.extenders = [];

  tryToAttachEntryFile();

  program.addCommand(init);
  program.addCommand(test);
  program.addCommand(build);
  program.addCommand(run);
  program.addCommand(code);

  // program.addCommand(gendoc);

  program.version(require("../../package.json").version);

  commandInjector(program);
  program.parse(process.argv);
};

main();
