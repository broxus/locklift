import { Command } from "commander";
import path from "path";
import fs from "fs-extra";
import * as utils from "../builder/utils";
import { execSyncWrapper } from "../builder/utils";
import { logger } from "../../logger";

const program = new Command();

program
  .name("init")
  .description("Initialize sample Locklift project in a directory")
  .option("-p, --path <path>", "Path to the project folder", ".")
  .option("-f, --force", "Ignore non-empty path", false)
  .action(async options => {
    const pathEmpty = utils.checkDirEmpty(options.path);
    if (!pathEmpty && options.force === false) {
      console.error(`Directory at ${options.path} should be empty!`);
      return;
    }
    const sampleProjectRelativePath = path.resolve(__dirname, "../../../sample-project-typescript");
    const sampleProjectPath = path.resolve(__dirname, sampleProjectRelativePath);
    await new Promise((res, rej) => {
      fs.copy(sampleProjectPath, options.path, (err: Error) => {
        if (err) {
          logger.printError(err);
          return rej(err);
        }

        logger.printInfo(`New Locklift project initialized in ${options.path}`);
        return res(undefined);
      });
    });
    const packageJson = {
      name: "locklift-project",
      version: "1.0.0",
      description: "",
      scripts: {
        test: "npx locklift test --network local",
      },
      author: "",
      license: "ISC",
      overrides: {
        "nekoton-wasm": "npm:nekoton-wasm-locklift@1.20.2",
      },
    };
    fs.writeFileSync(path.join(options.path, "./package.json"), JSON.stringify(packageJson, null, 2));
    const dependencies =
      "npm i --save-dev typescript@4.7.4 prettier chai@4.4.1 @types/chai @types/mocha @types/node ts-mocha locklift dotenv@16.0.3";
    logger.printInfo("Installing required dependencies...");

    if (options.path) {
      logger.printInfo(execSyncWrapper(`cd ${options.path} && ${dependencies}`).toString());
    }
    logger.printInfo(`LockLift initialized in ${options.path} happy hacking!`);
  });

export default program;
