"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountFactory = exports.Account = exports.accountAbiBase = void 0;
const constants_1 = require("../constants");
const utils_1 = require("../utils");
exports.accountAbiBase = {
    functions: [
        {
            name: "sendTransaction",
            inputs: [
                { name: "dest", type: "address" },
                { name: "value", type: "uint128" },
                { name: "bounce", type: "bool" },
                { name: "flags", type: "uint8" },
                { name: "payload", type: "cell" },
            ],
            outputs: [],
        },
    ],
};
class Account {
    accountContract;
    publicKey;
    constructor(accountContract, publicKey) {
        this.accountContract = accountContract;
        this.publicKey = publicKey;
    }
    static getAccount = (accountAddress, ever, publicKey, abi) => {
        return new Account(new ever.Contract(abi, accountAddress), publicKey);
    };
    static deployNewAccount = async (deployer, publicKey, value, abi, deployParams, constructorParams) => {
        const { contract, tx } = await deployer.deployContract(abi, deployParams, constructorParams, value);
        return { account: new Account(contract, publicKey), tx };
    };
    get address() {
        return this.accountContract.address;
    }
    runTarget = async (config, producer) => {
        return (0, utils_1.errorExtractor)(this.accountContract.methods
            .sendTransaction({
            value: config.value || (0, utils_1.convertCrystal)(2, constants_1.Dimensions.Nano),
            bounce: !!config.bounce,
            dest: config.contract.address,
            payload: await producer(config.contract).encodeInternal(),
            flags: config.flags || 0,
        })
            .sendExternal({ publicKey: this.publicKey }));
    };
}
exports.Account = Account;
class AccountFactory {
    deployer;
    ever;
    abi;
    tvc;
    constructor(deployer, ever, abi, tvc) {
        this.deployer = deployer;
        this.ever = ever;
        this.abi = abi;
        this.tvc = tvc;
    }
    getAccount = (accountAddress, publicKey) => Account.getAccount(accountAddress, this.ever, publicKey, this.abi);
    deployNewAccount = async (publicKey, value, deployParams, constructorParams) => Account.deployNewAccount(this.deployer, publicKey, value, this.abi, { ...deployParams, tvc: deployParams.tvc || this.tvc }, constructorParams);
}
exports.AccountFactory = AccountFactory;
