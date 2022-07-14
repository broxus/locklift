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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Locklift = exports.zeroAddress = exports.Dimensions = void 0;
const keys_1 = require("./keys");
const utils = __importStar(require("./utils"));
const provider_1 = require("./provider");
const factory_1 = require("./factory");
const utils_1 = require("./utils");
const tracing_1 = require("./tracing");
const utilsInternal_1 = require("./utilsInternal");
__exportStar(require("everscale-inpage-provider"), exports);
var constants_1 = require("./constants");
Object.defineProperty(exports, "Dimensions", { enumerable: true, get: function () { return constants_1.Dimensions; } });
Object.defineProperty(exports, "zeroAddress", { enumerable: true, get: function () { return constants_1.zeroAddress; } });
class Locklift {
    config;
    network;
    networkConfig;
    factory;
    giver;
    utils = utils;
    transactions;
    provider;
    tracing;
    constructor(config, network = "local") {
        this.config = config;
        this.network = network;
        this.networkConfig = this.config.networks[this.network];
    }
    async setup() {
        try {
            const keys = new keys_1.Keys(this.networkConfig.keys);
            const keyPairs = await keys.setup().then(() => keys.getKeyPairs());
            const giverKeys = (0, utilsInternal_1.getGiverKeyPair)(this.networkConfig.giver);
            this.provider = new provider_1.Provider({
                giverKeys,
                keys: keyPairs,
                connectionProperties: {
                    connection: this.networkConfig.connection,
                },
            });
            await this.provider.ever.ensureInitialized();
            this.giver = this.config.networks[this.network].giver.giverFactory(this.provider.ever, giverKeys, this.networkConfig.giver.address);
            this.factory = new factory_1.Factory(this.provider.ever, this.giver);
            await this.factory.setup();
            this.transactions = new utils_1.Transactions(this.provider.ever, this.tracing);
            this.tracing = (0, tracing_1.createTracing)({
                ever: this.provider.ever,
                features: this.transactions,
                factory: this.factory,
                endPoint: this.config.networks[this.network].tracing?.endPoint,
            });
        }
        catch (e) {
            console.error(e);
        }
    }
}
exports.Locklift = Locklift;
