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
exports.copyExternalFiles = exports.typeGenerator = void 0;
const fs_1 = __importDefault(require("fs"));
const fsPath = __importStar(require("path"));
const typeGenerator = (pathToBuildFolder) => {
    const generatedCode = getAbiFiles(pathToBuildFolder)
        .map(file => getContractAbi(pathToBuildFolder, file))
        .map(({ abi, name }) => ({
        contractName: name,
        code: generateContractCode({ abiSource: abi, contractName: name }),
    }));
    const abiSources = generatedCode.reduce((acc, { code: { abi } }) => acc + abi + "\n", "");
    const typingSources = generatedCode.reduce((acc, { code: { typing } }) => acc + typing + "\n", "");
    const factorySources = generatedCode.reduce((acc, { code: { contractName, abiSourceName } }) => ({
        ...acc,
        [contractName]: abiSourceName,
    }), {});
    const factorySourceObj = `export const factorySource = ${JSON.stringify(factorySources, null, 4).replace(/"/g, "")} as const\n\nexport type FactorySource = typeof factorySource`;
    fs_1.default.writeFileSync(fsPath.join(pathToBuildFolder, "./factorySource.ts"), abiSources + "\n" + factorySourceObj + "\n" + typingSources);
};
exports.typeGenerator = typeGenerator;
const generateContractCode = ({ abiSource, contractName, }) => {
    const abiSourceName = contractName.slice(0, 1).toLowerCase() + contractName.slice(1) + "Abi";
    return {
        abi: `const ${abiSourceName} = ${abiSource.replace(/\s/g, "")} as const`,
        abiSourceName,
        typing: `export type ${contractName}Abi = typeof ${abiSourceName}`,
        contractName,
    };
};
const getContractAbi = (pathToBuildFolder, fileName) => {
    const contractAbi = fs_1.default.readFileSync(fsPath.join(pathToBuildFolder, fileName), "utf8");
    const contractName = `${fileName.split(".abi.json")[0]}`;
    return {
        abi: contractAbi,
        name: contractName,
    };
};
const getAbiFiles = (buildPath) => {
    return fs_1.default.readdirSync(buildPath).filter(el => el.endsWith(".abi.json"));
};
const copyExternalFiles = (externalCotracts, destinationFolder) => {
    Object.entries(externalCotracts)
        .flatMap(([folderName, contracts]) => {
        const pathToFolder = fsPath.resolve(folderName);
        const files = fs_1.default.readdirSync(pathToFolder);
        return files
            .filter(file => contracts.some(contract => contract === file.split(".")[0]))
            .map(file => ({ file, pathToFolder }));
    })
        .forEach(({ pathToFolder, file }) => fs_1.default.copyFileSync(fsPath.join(pathToFolder, file), fsPath.join(destinationFolder, file)));
};
exports.copyExternalFiles = copyExternalFiles;
