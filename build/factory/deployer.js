"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deployer = void 0;
const utils_1 = require("../utils");
class Deployer {
    ever;
    giver;
    constructor(ever, giver) {
        this.ever = ever;
        this.giver = giver;
    }
    deployContract = async (abi, deployParams, constructorParams, value) => {
        const expectedAddress = await this.ever.getExpectedAddress(abi, deployParams);
        await (0, utils_1.errorExtractor)(this.giver.sendTo(expectedAddress, value));
        const contract = new this.ever.Contract(abi, expectedAddress);
        const stateInit = await this.ever.getStateInit(abi, deployParams);
        const tx = await (0, utils_1.errorExtractor)(contract.methods.constructor(constructorParams).sendExternal({
            stateInit: stateInit.stateInit,
            publicKey: deployParams.publicKey,
        }));
        return { contract, tx };
    };
}
exports.Deployer = Deployer;
