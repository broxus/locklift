import { KeyPair } from "everscale-crypto";
import { KeysConfig } from "../config";
/**
 * Simple keys manager. Initialize keys from the
 */
export declare class Keys {
    private readonly keysConfig;
    private keyPairs;
    constructor(keysConfig: Omit<KeysConfig, "phrase"> & {
        phrase: string;
    });
    /**
     * Returns key pairs.
     * @returns {Promise<[]|Array>}
     */
    getKeyPairs(): Promise<KeyPair[]>;
    /**
     * Derives specific amount of keys from the specified mnemonic phrase and HD path.
     * Phrase, amount and path should be specified in the keys config section
     * @returns {Promise<void>}
     */
    setup(): Promise<void>;
}
