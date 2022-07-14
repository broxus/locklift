"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transactions = exports.extractTransactionFromParams = exports.getKeyPairFromSecret = exports.errorExtractor = exports.getRandomNonce = exports.convertCrystal = exports.loadBase64FromFile = exports.loadJSONFromFile = void 0;
const constants_1 = require("../constants");
const fs_1 = __importDefault(require("fs"));
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const everscale_crypto_1 = require("everscale-crypto");
const loadJSONFromFile = (filePath) => {
    return JSON.parse(fs_1.default.readFileSync(filePath, "utf8"));
};
exports.loadJSONFromFile = loadJSONFromFile;
const loadBase64FromFile = (filePath) => {
    return fs_1.default.readFileSync(filePath, "utf8").split("\n").join("");
};
exports.loadBase64FromFile = loadBase64FromFile;
const convertCrystal = (amount, dimension) => {
    const crystalBN = new bignumber_js_1.default(amount);
    switch (dimension) {
        case constants_1.Dimensions.Nano:
            return crystalBN.times(10 ** 9).toFixed(0);
        case constants_1.Dimensions.Ton:
            return crystalBN.div(new bignumber_js_1.default(10).pow(9)).toString();
    }
};
exports.convertCrystal = convertCrystal;
const getRandomNonce = () => (Math.random() * 64000) | 0;
exports.getRandomNonce = getRandomNonce;
const errorExtractor = async (transactionResult) => {
    return transactionResult.then((res) => {
        if (res.transaction.aborted) {
            throw {
                message: `Transaction aborted with code ${res.transaction.exitCode}`,
                transaction: res,
            };
        }
        return res;
    });
};
exports.errorExtractor = errorExtractor;
const getKeyPairFromSecret = (secretKey) => {
    return {
        secretKey,
        publicKey: (0, everscale_crypto_1.getPublicKey)(secretKey),
    };
};
exports.getKeyPairFromSecret = getKeyPairFromSecret;
const extractTransactionFromParams = (transaction) => {
    return "tx" in transaction ? transaction.tx.transaction : transaction.transaction;
};
exports.extractTransactionFromParams = extractTransactionFromParams;
class Transactions {
    provider;
    tracing;
    constructor(provider, tracing) {
        this.provider = provider;
        this.tracing = tracing;
    }
    waitFinalized = async (transactionProm) => {
        const transaction = await transactionProm;
        const subscription = new this.provider.Subscriber();
        return subscription
            .trace((0, exports.extractTransactionFromParams)(transaction))
            .finished()
            .then(subscription.unsubscribe.bind(subscription))
            .then(() => transaction);
    };
}
exports.Transactions = Transactions;
