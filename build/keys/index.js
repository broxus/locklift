"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Keys = void 0;
const everscale_crypto_1 = require("everscale-crypto");
class Keys {
    /**
     * Derives specific amount of keys from the specified mnemonic phrase and HD path.
     * Phrase, amount and path should be specified in the keys config section
     * @returns {Promise<KeyPair[]>}
     */
    static async generate(config) {
        return [...Array(config.amount).keys()].map(i => {
            const path = config.path.replace("INDEX", `${i}`);
            return (0, everscale_crypto_1.deriveBip39Phrase)(config.phrase, path);
        });
    }
}
exports.Keys = Keys;
