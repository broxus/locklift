import { Locklift } from '../index';
import { KeyPair } from '@tonclient/core';


/**
 * Simple keys manager. Initialize keys from the
 */
export class Keys {
  private locklift: Locklift;
  private keyPairs: KeyPair[];

  constructor(locklift: Locklift) {
    this.locklift = locklift;
    this.keyPairs = [];
  }

  /**
   * Returns key pairs.
   * @returns {Promise<[]|Array>}
   */
  async getKeyPairs(): Promise<KeyPair[]> {
    return this.keyPairs;
  }

  /**
   * Derives specific amount of keys from the specified mnemonic phrase and HD path.
   * Phrase, amount and path should be specified in the keys config section
   * @returns {Promise<void>}
   */
  async setup(): Promise<void> {
    const keysHDPaths = [...Array(this.locklift.networkConfig.keys.amount).keys()]
      .map(i => this.locklift.networkConfig.keys.path.replace('INDEX', `${i}`));

    if (process.platform !== "darwin") {
      this.keyPairs = await Promise.all(keysHDPaths.map(async (path) => {
        return this.locklift.ton.client.crypto.mnemonic_derive_sign_keys({
          dictionary: 1,
          word_count: 12,
          phrase: this.locklift.networkConfig.keys.phrase,
          path,
        });
      }));
    } else {
      for (const path of keysHDPaths) {
        this.keyPairs.push(
          await this.locklift.ton.client.crypto.mnemonic_derive_sign_keys({
            dictionary: 1,
            word_count: 12,
            phrase: this.locklift.networkConfig.keys.phrase,
            path,
        }));
      }
    }
  }
}
