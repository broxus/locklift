"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupportedVersions = exports.executableFileName = exports.fileNames = exports.downloadLinks = exports.replaceDots = exports.getGzFileName = void 0;
const constances_1 = require("./constances");
const axios_1 = __importDefault(require("axios"));
const isWin32 = process.platform === "win32";
const isLinux = process.platform === "linux";
const isDarwin = process.platform === "darwin";
const getGzFileName = (fileName) => fileName + ".gz";
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
    [constances_1.ComponentType.COMPILER]: getCompilerUrl,
    [constances_1.ComponentType.LINKER]: getLinkerUrl,
    [constances_1.ComponentType.LIB]: getLibUrl,
};
exports.fileNames = {
    [constances_1.ComponentType.COMPILER]: getCompilerFileName,
    [constances_1.ComponentType.LINKER]: getLinkerFileName,
    [constances_1.ComponentType.LIB]: getLibFileName,
};
const getExecutableCompilerName = ({ version }) => {
    const fileName = exports.fileNames[constances_1.ComponentType.COMPILER]({ version });
    if (isWin32) {
        return fileName + ".exe";
    }
    return fileName;
};
const getExecutableLinkerName = ({ version }) => {
    const fileName = exports.fileNames[constances_1.ComponentType.LINKER]({ version });
    if (isWin32) {
        return fileName + ".exe";
    }
    return fileName;
};
const getExecutableLibName = ({ version }) => {
    return exports.fileNames[constances_1.ComponentType.LIB]({ version });
};
exports.executableFileName = {
    [constances_1.ComponentType.COMPILER]: getExecutableCompilerName,
    [constances_1.ComponentType.LINKER]: getExecutableLinkerName,
    [constances_1.ComponentType.LIB]: getExecutableLibName,
};
const getSupportedVersions = ({ component }) => {
    switch (component) {
        case constances_1.ComponentType.COMPILER:
            return axios_1.default.get("https://binaries.tonlabs.io/solc.json").then((res) => res.data.solc);
        case constances_1.ComponentType.LINKER:
            return axios_1.default
                .get("https://binaries.tonlabs.io/tvm_linker.json")
                .then((res) => res.data.tvm_linker);
        case constances_1.ComponentType.LIB:
            return axios_1.default.get("https://binaries.tonlabs.io/solc.json").then((res) => res.data.solc);
    }
};
exports.getSupportedVersions = getSupportedVersions;
