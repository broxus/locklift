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
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const utils = __importStar(require("../builder/utils"));
const utils_1 = require("../builder/utils");
const program = new commander_1.Command();
program
    .name("init")
    .description("Initialize sample Locklift project in a directory")
    .option("-p, --path <path>", "Path to the project folder", ".")
    .option("-f, --force", "Ignore non-empty path", false)
    .action(async (options) => {
    const pathEmpty = utils.checkDirEmpty(options.path);
    if (!pathEmpty && options.force === false) {
        console.error(`Directory at ${options.path} should be empty!`);
        return;
    }
    const sampleProjectRelativePath = path_1.default.resolve(__dirname, "../../../sample-project-typescript");
    const sampleProjectPath = path_1.default.resolve(__dirname, sampleProjectRelativePath);
    await new Promise((res, rej) => {
        fs_extra_1.default.copy(sampleProjectPath, options.path, (err) => {
            if (err) {
                console.error(err);
                return rej(err);
            }
            console.log(`New Locklift project initialized in ${options.path}`);
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
    };
    fs_extra_1.default.writeFileSync(path_1.default.join(options.path, "./package.json"), JSON.stringify(packageJson, null, 2));
    const dependencies = "npm i --save-dev typescript@4.7.4 prettier chai @types/chai @types/mocha @types/node everscale-standalone-client ts-mocha locklift";
    console.log("Installing required dependencies...");
    if (options.path) {
        console.log((0, utils_1.execSyncWrapper)(`cd ${options.path} && ${dependencies}`).toString());
    }
    console.log(`LockLift initialized in ${options.path} happy hacking!`);
});
exports.default = program;
