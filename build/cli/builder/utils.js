"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryToGetNodeModules = exports.execSyncWrapper = exports.extractContractName = exports.tvcToBase64 = exports.compilerConfigResolver = exports.flatDirTree = exports.checkDirEmpty = void 0;
const fs_1 = __importDefault(require("fs"));
const constants_1 = require("../../compilerComponentsStore/constants");
const compilerComponentsStore_1 = require("../../compilerComponentsStore");
const child_process_1 = require("child_process");
const path_1 = require("path");
function checkDirEmpty(dir) {
    if (!fs_1.default.existsSync(dir)) {
        return dir;
    }
    return fs_1.default.readdirSync(dir).length === 0;
}
exports.checkDirEmpty = checkDirEmpty;
function flatDirTree(tree) {
    return tree.children?.reduce((acc, current) => {
        if (current.children === undefined) {
            return [...acc, current];
        }
        const flatChild = flatDirTree(current);
        if (!flatChild)
            return acc;
        return [...acc, ...flatChild];
    }, []);
}
exports.flatDirTree = flatDirTree;
const compilerConfigResolver = async ({ compiler, linker, }) => {
    const builderConfig = {
        includesPath: compiler.includesPath,
        externalContracts: compiler.externalContracts,
    };
    if ("path" in compiler) {
        builderConfig.compilerPath = compiler.path;
    }
    if ("version" in compiler) {
        builderConfig.compilerPath = await (0, compilerComponentsStore_1.getComponent)({
            component: constants_1.ComponentType.COMPILER,
            version: compiler.version,
        });
    }
    if ("path" in linker) {
        builderConfig.linkerPath = linker.path;
        builderConfig.linkerLibPath = linker.lib;
    }
    if ("version" in linker) {
        if (!("version" in compiler)) {
            throw new Error("You can't provide linker version without compiler version!");
        }
        builderConfig.linkerPath = await (0, compilerComponentsStore_1.getComponent)({
            version: linker.version,
            component: constants_1.ComponentType.LINKER,
        });
        builderConfig.linkerLibPath = await (0, compilerComponentsStore_1.getComponent)({
            version: compiler.version,
            component: constants_1.ComponentType.LIB,
        });
    }
    return builderConfig;
};
exports.compilerConfigResolver = compilerConfigResolver;
const tvcToBase64 = (tvc) => tvc.toString("base64");
exports.tvcToBase64 = tvcToBase64;
const extractContractName = (pathToFile) => 
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
pathToFile.match(new RegExp("contracts(.*).sol"))[1].slice(1);
exports.extractContractName = extractContractName;
function execSyncWrapper(command, options) {
    try {
        return (0, child_process_1.execSync)(command, options);
    }
    catch (err) {
        const ioError = err;
        throw new Error(`${ioError.toString()}stdout: ${ioError.stdout.toString()}`);
    }
}
exports.execSyncWrapper = execSyncWrapper;
const tryToGetNodeModules = () => {
    try {
        return (0, path_1.resolve)(require.resolve("locklift/package.json"), "../../");
    }
    catch (e) {
        return undefined;
    }
};
exports.tryToGetNodeModules = tryToGetNodeModules;
