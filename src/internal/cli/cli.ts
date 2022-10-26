#!/usr/bin/env node
import * as path from "path";

process.env.TS_NODE_PROJECT = path.join(__dirname, "../../tsconfig.json");
process.env.TS_CONFIG_PATHS = "true";

import { program } from "commander";
import init from "./commands/init";
import build from "./commands/build";
import test from "./commands/test";
import run from "./commands/run";
import { loadConfig } from "../config";
import { commandInjector } from "../../plugins/utils";

// import gendoc from "./commands/gendoc";
const main = async () => {
  global.extenders = [];
  loadConfig("locklift.config.ts");
  program.addCommand(init);
  program.addCommand(test);
  program.addCommand(build);
  program.addCommand(run);
  // program.addCommand(gendoc);

  program.version(require("../../package.json").version);

  commandInjector(program);
  program.parse(process.argv);
};

main();
