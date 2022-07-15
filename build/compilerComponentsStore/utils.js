"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupportedVersions = exports.executableFileName = exports.fileNames = exports.downloadLinks = exports.replaceDots = exports.getGzFileName = void 0;
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("./constants");
const platforms = {
    isWin32: process.platform === "win32",
    isLinux: process.platform === "linux",
    isDarwin: process.platform === "darwin",
};
const getGzFileName = (fileName) => `${fileName}.gz`;
exports.getGzFileName = getGzFileName;
const getLinkerUrl = ({ version }) => `https://binaries.tonlabs.io/${(0, exports.getGzFileName)(getLinkerFileName({ version }))}`;
const getCompilerUrl = ({ version }) => `https://binaries.tonlabs.io/${(0, exports.getGzFileName)(getCompilerFileName({ version }))}`;
const getLibUrl = ({ version }) => `http://sdkbinaries.tonlabs.io/${(0, exports.getGzFileName)(getLibFileName({ version }))}`;
const replaceDots = (arg) => arg.replace(/\./g, "_");
exports.replaceDots = replaceDots;
const getLinkerFileName = ({ version }) => `tvm_linker_${(0, exports.replaceDots)(version)}_${process.platform}`;
const getCompilerFileName = ({ version }) => `solc_${(0, exports.replaceDots)(version)}_${process.platform}`;
const getLibFileName = ({ version }) => `stdlib_sol_${(0, exports.replaceDots)(version)}.tvm`;
exports.downloadLinks = {
    [constants_1.ComponentType.COMPILER]: getCompilerUrl,
    [constants_1.ComponentType.LINKER]: getLinkerUrl,
    [constants_1.ComponentType.LIB]: getLibUrl,
};
exports.fileNames = {
    [constants_1.ComponentType.COMPILER]: getCompilerFileName,
    [constants_1.ComponentType.LINKER]: getLinkerFileName,
    [constants_1.ComponentType.LIB]: getLibFileName,
};
const getExecutableCompilerName = ({ version }) => {
    const fileName = exports.fileNames[constants_1.ComponentType.COMPILER]({ version });
    if (platforms.isWin32) {
        return fileName + ".exe";
    }
    return fileName;
};
const getExecutableLinkerName = ({ version }) => {
    const fileName = exports.fileNames[constants_1.ComponentType.LINKER]({ version });
    if (platforms.isWin32) {
        return fileName + ".exe";
    }
    return fileName;
};
const getExecutableLibName = ({ version }) => {
    return exports.fileNames[constants_1.ComponentType.LIB]({ version });
};
exports.executableFileName = {
    [constants_1.ComponentType.COMPILER]: getExecutableCompilerName,
    [constants_1.ComponentType.LINKER]: getExecutableLinkerName,
    [constants_1.ComponentType.LIB]: getExecutableLibName,
};
const getSupportedVersions = ({ component }) => {
    switch (component) {
        case constants_1.ComponentType.COMPILER:
            return axios_1.default.get("https://binaries.tonlabs.io/solc.json").then(res => res.data.solc);
        case constants_1.ComponentType.LINKER:
            return axios_1.default
                .get("https://binaries.tonlabs.io/tvm_linker.json")
                .then(res => res.data.tvm_linker);
        case constants_1.ComponentType.LIB:
            return axios_1.default.get("https://binaries.tonlabs.io/solc.json").then(res => res.data.solc);
    }
};
exports.getSupportedVersions = getSupportedVersions;
