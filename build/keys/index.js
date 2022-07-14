"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Keys = void 0;
const everscale_crypto_1 = require("everscale-crypto");
/**
 * Simple keys manager. Initialize keys from the
 */
class Keys {
    keysConfig;
    keyPairs;
    constructor(keysConfig) {
        this.keysConfig = keysConfig;
        this.keyPairs = [];
    }
    /**
     * Returns key pairs.
     * @returns {Promise<[]|Array>}
     */
    async getKeyPairs() {
        return this.keyPairs;
    }
    /**
     * Derives specific amount of keys from the specified mnemonic phrase and HD path.
     * Phrase, amount and path should be specified in the keys config section
     * @returns {Promise<void>}
     */
    async setup() {
        const keysHDPaths = [...Array(this.keysConfig.amount).keys()].map((i) => this.keysConfig.path?.replace("INDEX", `${i}`));
        if (process.platform !== "darwin") {
            this.keyPairs = await Promise.all(keysHDPaths.map(async (path) => {
                return (0, everscale_crypto_1.deriveBip39Phrase)(this.keysConfig.phrase, path);
            }));
        }
        else {
            for (const path of keysHDPaths) {
                this.keyPairs.push(await (0, everscale_crypto_1.deriveBip39Phrase)(this.keysConfig.phrase, path));
            }
        }
    }
}
exports.Keys = Keys;
