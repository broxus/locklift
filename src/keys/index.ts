import { deriveBip39Phrase, KeyPair } from "everscale-crypto";
import { KeysConfig } from "../config";

export class Keys {
  /**
   * Derives specific amount of keys from the specified mnemonic phrase and HD path.
   * Phrase, amount and path should be specified in the keys config section
   * @returns {Promise<KeyPair[]>}
   */
  public static async generate(config: Required<KeysConfig>): Promise<KeyPair[]> {
    return [...Array(config.amount).keys()].map(i => {
      const path = config.path.replace("INDEX", `${i}`);
      return deriveBip39Phrase(config.phrase, path);
    });
  }
}
