"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const commander_1 = require("commander");
require("ts-node");
const config_1 = require("../../config");
const index_1 = require("../../index");
const builder_1 = require("../builder");
const fs_extra_1 = __importDefault(require("fs-extra"));
const tsNode = __importStar(require("ts-node"));
const utils_1 = require("../builder/utils");
const program = new commander_1.Command();
program
    .name("run")
    .description("Run arbitrary locklift script")
    .option("--disable-build", "Disable automatic contracts build", false)
    .option("-c, --contracts <contracts>", "Path to the contracts folder", "contracts")
    .option("-b, --build <build>", "Path to the build folder", "build")
    .option("--disable-include-path", "Disables including node_modules. Use this with old compiler versions", false)
    .requiredOption("-n, --network <network>", "Network to use, choose from configuration")
    .addOption(new commander_1.Option("--config <config>", "Path to the config file")
    .default(() => (0, config_1.loadConfig)("locklift.config.ts"))
    .argParser(async (config) => () => (0, config_1.loadConfig)(config)))
    .requiredOption("-s, --script <script>", "Script to run")
    .allowUnknownOption()
    .action(async (options) => {
    const config = await options.config();
    if (config.networks[options.network] === undefined) {
        console.error(`Can't find configuration for ${options.network} network!`);
        process.exit(1);
    }
    if (options.disableBuild !== true) {
        fs_extra_1.default.ensureDirSync(options.build);
        const builder = new builder_1.Builder(await (0, utils_1.compilerConfigResolver)(config), options);
        const status = await builder.buildContracts();
        if (!status)
            process.exit(1);
    }
    // Initialize Locklift
    const locklift = await index_1.Locklift.setup(config, options.network);
    //@ts-ignore
    global.locklift = locklift;
    global.__dirname = __dirname;
    process.env.TS_CONFIG_PATHS = path_1.default.resolve(process.cwd(), "tsconfig.json");
    if (process.env.TS_CONFIG_PATHS) {
        require("tsconfig-paths/register");
    }
    await tsNode.register({
        project: process.env.TS_CONFIG_PATHS,
        files: false,
        transpileOnly: true,
    });
    require(path_1.default.resolve(process.cwd(), options.script));
});
exports.default = program;
