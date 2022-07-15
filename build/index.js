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
exports.Locklift = exports.zeroAddress = exports.Dimension = void 0;
const everscale_inpage_provider_1 = require("everscale-inpage-provider");
const nodejs_1 = require("everscale-standalone-client/nodejs");
const keys_1 = require("./keys");
const utils = __importStar(require("./utils"));
const factory_1 = require("./factory");
const utils_1 = require("./utils");
const tracing_1 = require("./tracing");
const utilsInternal_1 = require("./utilsInternal");
__exportStar(require("everscale-inpage-provider"), exports);
var constants_1 = require("./constants");
Object.defineProperty(exports, "Dimension", { enumerable: true, get: function () { return constants_1.Dimension; } });
Object.defineProperty(exports, "zeroAddress", { enumerable: true, get: function () { return constants_1.zeroAddress; } });
class Locklift {
    factory;
    giver;
    provider;
    clock;
    keystore;
    transactions;
    tracing;
    utils = utils;
    constructor(factory, giver, provider, clock, keystore, transactions, tracing) {
        this.factory = factory;
        this.giver = giver;
        this.provider = provider;
        this.clock = clock;
        this.keystore = keystore;
        this.transactions = transactions;
        this.tracing = tracing;
    }
    static async setup(config, network = "local") {
        try {
            const networkConfig = config.networks[network];
            const giverKeys = (0, utilsInternal_1.getGiverKeyPair)(networkConfig.giver);
            const keys = await keys_1.Keys.generate(networkConfig.keys);
            const keystore = new nodejs_1.SimpleKeystore([...keys].reduce((acc, keyPair, idx) => ({
                ...acc,
                [idx]: keyPair,
            }), {}));
            keystore.addKeyPair("giver", giverKeys);
            const clock = new nodejs_1.Clock();
            const provider = new everscale_inpage_provider_1.ProviderRpcClient({
                fallback: () => nodejs_1.EverscaleStandaloneClient.create({
                    connection: networkConfig.connection,
                    keystore,
                    clock,
                }),
            });
            await provider.ensureInitialized();
            const giver = networkConfig.giver.giverFactory(provider, giverKeys, networkConfig.giver.address);
            const factory = await factory_1.Factory.setup(provider, giver);
            const transactions = new utils_1.Transactions(provider);
            const tracing = (0, tracing_1.createTracing)({
                ever: provider,
                features: transactions,
                factory,
                endpoint: networkConfig.tracing?.endpoint,
            });
            return new Locklift(factory, giver, provider, clock, keystore, transactions, tracing);
        }
        catch (e) {
            throw e;
        }
    }
}
exports.Locklift = Locklift;
