import { deriveBip39Phrase, KeyPair } from "everscale-crypto";
import { KeysConfig } from "../config";

/**
 * Simple keys manager. Initialize keys from the
 */
export class Keys {
  private keyPairs: KeyPair[];

  constructor(private readonly keysConfig: Omit<KeysConfig, "phrase"> & { phrase: string }) {
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
    const keysHDPaths = [...Array(this.keysConfig.amount).keys()].map((i) =>
      this.keysConfig.path?.replace("INDEX", `${i}`),
    );

    if (process.platform !== "darwin") {
      this.keyPairs = await Promise.all(
        keysHDPaths.map(async (path) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return deriveBip39Phrase(this.keysConfig.phrase, path!);
        }),
      );
    } else {
      for (const path of keysHDPaths) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.keyPairs.push(await deriveBip39Phrase(this.keysConfig.phrase, path!));
      }
    }
  }
}
