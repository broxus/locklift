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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Factory = exports.Account = void 0;
const account_1 = require("./account");
const deployer_1 = require("./deployer");
const utils = __importStar(require("../utils"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("../cli/builder/utils");
const directory_tree_1 = __importDefault(require("directory-tree"));
const core_1 = require("@tonclient/core");
const lib_node_1 = require("@tonclient/lib-node");
const utils_2 = require("./utils");
var account_2 = require("./account");
Object.defineProperty(exports, "Account", { enumerable: true, get: function () { return account_2.Account; } });
__exportStar(require("./giver"), exports);
__exportStar(require("./deployer"), exports);
core_1.TonClient.useBinaryLibrary(lib_node_1.libNode);
const tonClient = new core_1.TonClient({});
class Factory {
    ever;
    giver;
    factoryCache = {};
    constructor(ever, giver) {
        this.ever = ever;
        this.giver = giver;
    }
    setup = async () => {
        //setupCache
        await this.getContractsArtifacts().then((artifacts) => {
            artifacts.forEach(({ artifacts, contractName }) => {
                this.factoryCache[contractName] = artifacts;
            });
        });
    };
    get deployer() {
        return new deployer_1.Deployer(this.ever, this.giver);
    }
    deployContract = async (contractName, deployParams, constructorParams, value) => {
        const { tvc, abi } = this.getContractArtifacts(contractName);
        return this.deployer.deployContract(abi, { ...deployParams, tvc: deployParams.tvc || tvc }, constructorParams, value);
    };
    getAccountsFactory = (contractName) => {
        const { tvc, abi } = this.getContractArtifacts(contractName);
        (0, utils_2.validateAccountAbi)(abi);
        return new account_1.AccountFactory(this.deployer, this.ever, abi, tvc);
    };
    getDeployedContract = (name, address) => {
        return new this.ever.Contract(this.getContractArtifacts(name).abi, address);
    };
    initializeContract = async (name, resolvedPath) => {
        const base64 = utils.loadBase64FromFile(path_1.default.resolve(resolvedPath, name + ".base64"));
        const abi = utils.loadJSONFromFile(path_1.default.resolve(resolvedPath, name + ".abi.json"));
        const decoded = await tonClient.boc.decode_tvc({ tvc: base64 });
        return {
            tvc: base64,
            code: (await this.ever.splitTvc(base64)).code,
            abi,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            hashCode: decoded.code_hash,
        };
    };
    getContractsArtifacts = async () => {
        const resolvedBuildPath = path_1.default.resolve(process.cwd(), "build");
        const contractsNestedTree = (0, directory_tree_1.default)(resolvedBuildPath, {
            extensions: /\.json/,
        });
        const contractNames = (0, utils_1.flatDirTree)(contractsNestedTree)?.map((el) => el.name.slice(0, -9));
        return await Promise.all(contractNames.map(async (contractName) => ({
            artifacts: await this.initializeContract(contractName, resolvedBuildPath),
            contractName,
        })));
    };
    getContractArtifacts = (name) => {
        return this.factoryCache[name];
    };
    getAllArtifacts = () => {
        return Object.entries(this.factoryCache).map(([contractName, artifacts]) => ({
            contractName,
            artifacts,
        }));
    };
    getContractByCodeHash = (codeHash, address) => {
        const contractArtifacts = this.getAllArtifacts().find(({ artifacts }) => artifacts.hashCode === codeHash);
        return (contractArtifacts && {
            contract: this.getDeployedContract(contractArtifacts.contractName, address),
            name: contractArtifacts.contractName,
        });
    };
}
exports.Factory = Factory;
