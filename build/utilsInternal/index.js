"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGiverKeyPair = void 0;
const everscale_crypto_1 = require("everscale-crypto");
const utils_1 = require("../utils");
const getGiverKeyPair = (giverSettings) => {
    if ("key" in giverSettings) {
        return (0, utils_1.getKeyPairFromSecret)(giverSettings.key);
    }
    if ("phrase" in giverSettings && "accountId" in giverSettings) {
        return (0, everscale_crypto_1.deriveBip39Phrase)(giverSettings.phrase, (0, everscale_crypto_1.makeBip39Path)(giverSettings.accountId));
    }
    throw new Error("You should provide secret key or phrase(with accountId) in giver settings");
};
exports.getGiverKeyPair = getGiverKeyPair;
