"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const config_1 = require("../../config");
const builder_1 = require("../builder");
const fs_extra_1 = __importDefault(require("fs-extra"));
const utils_1 = require("../builder/utils");
const program = new commander_1.Command();
program
    .name("gendoc")
    .description("Generate smart contracts documentation from the natspec comments")
    .option("-c, --contracts <contracts>", "Path to the contracts folder", "contracts")
    .option("-b, --build <build>", "Path to the build folder", "build")
    .option("--disable-include-path", "Disables including node_modules. Use this with old compiler versions", false)
    .option("-d, --docs <docs>", "Path to the docs folder", "docs")
    .option("-i, --include <include>", "Generate docs only for contracts, whose name matches the patters", ".*")
    .addOption(new commander_1.Option("-m, --mode <mode>", "Mode for compiler doc generator").default("devdoc").choices(["devdoc", "userdoc"]))
    .addOption(new commander_1.Option("--config <config>", "Path to the config file")
    .default(() => (0, config_1.loadConfig)("locklift.config.ts"))
    .argParser(async (config) => () => (0, config_1.loadConfig)(config)))
    .action(async (options) => {
    const config = await options.config();
    fs_extra_1.default.ensureDirSync(options.build);
    fs_extra_1.default.ensureDirSync(options.docs);
    const builder = new builder_1.Builder(await (0, utils_1.compilerConfigResolver)(config), options);
    try {
        const status = builder.buildDocs();
        if (!status) {
            process.exit(1);
        }
        else {
            process.exit(0);
        }
    }
    catch (e) {
        console.log(e);
    }
});
exports.default = program;
