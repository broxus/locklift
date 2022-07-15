import { KeyPair } from "everscale-crypto";
import { KeysConfig } from "../config";
export declare class Keys {
    /**
     * Derives specific amount of keys from the specified mnemonic phrase and HD path.
     * Phrase, amount and path should be specified in the keys config section
     * @returns {Promise<KeyPair[]>}
     */
    static generate(config: Required<KeysConfig>): Promise<KeyPair[]>;
}
