import { Command } from "commander";
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
