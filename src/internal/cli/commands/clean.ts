import { Command } from "commander";
import path from "path";
import fs from "fs-extra";
import * as utils from "../builder/utils";
import { execSyncWrapper } from "../builder/utils";
import { logger } from "../../logger";
import { BuildCache } from "../../buildCache";
import * as process from "process";

const program = new Command();

program
  .name("clean")
  .description("Clean cache folder")
  .action(() => {
    BuildCache.clearCache();
    process.exit(0);
  });

export default program;
