"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const config_1 = require("../../config");
const fs_extra_1 = __importDefault(require("fs-extra"));
const builder_1 = require("../builder");
const utils_1 = require("../builder/utils");
const program = new commander_1.Command();
program
    .name("build")
    .description("Build contracts by using Ever Solidity compiler and TVM linker")
    .option("-c, --contracts <contracts>", "Path to the contracts folder", "contracts")
    .option("-b, --build <build>", "Path to the build folder", "build")
    .option("--disable-include-path", "Disables including node_modules. Use this with old compiler versions", false)
    .addOption(new commander_1.Option("--config <config>", "Path to the config file")
    .default(async () => (0, config_1.loadConfig)("locklift.config.ts"))
    .argParser(async (config) => () => (0, config_1.loadConfig)(config)))
    .action(async (options) => {
    const config = await options.config();
    fs_extra_1.default.ensureDirSync(options.build);
    const builder = new builder_1.Builder(await (0, utils_1.compilerConfigResolver)(config), options);
    const status = await builder.buildContracts();
    if (!status)
        process.exit(1);
    process.exit(0);
});
exports.default = program;
