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
const path_1 = __importDefault(require("path"));
const directory_tree_1 = __importDefault(require("directory-tree"));
const utils = __importStar(require("../utils"));
const account_1 = require("./account");
const deployer_1 = require("./deployer");
const utils_1 = require("./utils");
const utils_2 = require("../cli/builder/utils");
var account_2 = require("./account");
Object.defineProperty(exports, "Account", { enumerable: true, get: function () { return account_2.Account; } });
__exportStar(require("./giver"), exports);
__exportStar(require("./deployer"), exports);
class Factory {
    ever;
    giver;
    factoryCache = {};
    constructor(ever, giver) {
        this.ever = ever;
        this.giver = giver;
    }
    static async setup(ever, giver) {
        const factory = new Factory(ever, giver);
        await factory.getContractsArtifacts().then(artifacts => {
            artifacts.forEach(({ artifacts, contractName }) => {
                factory.factoryCache[contractName] = artifacts;
            });
        });
        return factory;
    }
    get deployer() {
        return new deployer_1.Deployer(this.ever, this.giver);
    }
    async deployContract(args) {
        const { tvc, abi } = this.getContractArtifacts(args.contract);
        return this.deployer.deployContract(abi, {
            tvc: args.tvc || tvc,
            workchain: args.workchain,
            publicKey: args.publicKey,
            initParams: args.initParams,
        }, args.constructorParams, args.value);
    }
    getAccountsFactory(contractName) {
        const { tvc, abi } = this.getContractArtifacts(contractName);
        (0, utils_1.validateAccountAbi)(abi);
        return new account_1.AccountFactory(this.deployer, this.ever, abi, tvc);
    }
    getDeployedContract = (name, address) => {
        return new this.ever.Contract(this.getContractArtifacts(name).abi, address);
    };
    initializeContract = async (name, resolvedPath) => {
        const tvc = utils.loadBase64FromFile(path_1.default.resolve(resolvedPath, name + ".base64"));
        const abi = utils.loadJSONFromFile(path_1.default.resolve(resolvedPath, name + ".abi.json"));
        const { code } = await this.ever.splitTvc(tvc);
        if (code == null) {
            throw new Error(`Contract TVC ${name} doesn't contain code`);
        }
        const codeHash = await this.ever.getBocHash(code);
        return {
            tvc,
            code,
            abi,
            codeHash,
        };
    };
    getContractArtifacts(name) {
        return this.factoryCache[name];
    }
    getAllArtifacts() {
        return Object.entries(this.factoryCache).map(([contractName, artifacts]) => ({
            contractName,
            artifacts,
        }));
    }
    getContractByCodeHash = (codeHash, address) => {
        const contractArtifacts = this.getAllArtifacts().find(({ artifacts }) => artifacts.codeHash === codeHash);
        return (contractArtifacts && {
            contract: this.getDeployedContract(contractArtifacts.contractName, address),
            name: contractArtifacts.contractName,
        });
    };
    async getContractsArtifacts() {
        const resolvedBuildPath = path_1.default.resolve(process.cwd(), "build");
        const contractsNestedTree = (0, directory_tree_1.default)(resolvedBuildPath, {
            extensions: /\.json/,
        });
        const contractNames = (0, utils_2.flatDirTree)(contractsNestedTree)?.map(el => el.name.slice(0, -9));
        return await Promise.all(contractNames.map(async (contractName) => ({
            artifacts: await this.initializeContract(contractName, resolvedBuildPath),
            contractName,
        })));
    }
}
exports.Factory = Factory;
