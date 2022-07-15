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
const commander_1 = require("commander");
const mocha_1 = __importDefault(require("mocha"));
require("ts-mocha");
const path_1 = __importDefault(require("path"));
const directory_tree_1 = __importDefault(require("directory-tree"));
const config_1 = require("../../config");
const index_1 = require("../../index");
const utils = __importStar(require("../builder/utils"));
const builder_1 = require("../builder");
const utils_1 = require("../builder/utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const program = new commander_1.Command();
program
    .name("test")
    .description("Run mocha tests")
    .option("--disable-build", "Disable automatic contracts build", false)
    .option("-t, --test <test>", "Path to Mocha test folder", "test")
    .option("-c, --contracts <contracts>", "Path to the contracts folder", "contracts")
    .option("-b, --build <build>", "Path to the build folder", "build")
    .option("--disable-include-path", "Disables including node_modules. Use this with old compiler versions", false)
    .requiredOption("-n, --network <network>", "Network to use, choose from configuration")
    .addOption(new commander_1.Option("--config <config>", "Path to the config file")
    .default(async () => (0, config_1.loadConfig)("locklift.config.ts"))
    .argParser(async (config) => () => (0, config_1.loadConfig)(config)))
    .option("--tests [tests...]", "Set of tests to run, separated by comma")
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
    // Initialize Locklift and pass it into tests context
    const locklift = await index_1.Locklift.setup(config, options.network);
    //@ts-ignore
    global.locklift = locklift;
    // Run mocha tests
    if (config.mocha?.tsconfig) {
        process.env.TS_NODE_PROJECT = config.mocha?.tsconfig;
        process.env.TS_CONFIG_PATHS = "true";
    }
    const mocha = new mocha_1.default({ ...config.mocha });
    // Run all .js files in tests or only specified tests
    let testFiles;
    if (Array.isArray(options.tests)) {
        testFiles = options.tests;
    }
    else {
        const testNestedTree = (0, directory_tree_1.default)(path_1.default.resolve(process.cwd(), options.test), { extensions: /\.(js|ts)/ });
        testFiles = utils.flatDirTree(testNestedTree)?.map(t => t.path) || [];
    }
    testFiles.forEach((file) => mocha.addFile(file));
    mocha.run(fail => process.exit(fail ? 1 : 0));
});
exports.default = program;
