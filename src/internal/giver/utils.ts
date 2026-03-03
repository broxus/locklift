import { GiverConfig } from "../config";
import { deriveBip39Phrase, KeyPair, makeBip39Path, deriveTonMnemonic } from "everscale-crypto";
import { getKeyPairFromSecret } from "../../utils";

export const getGiverKeyPair = (giverSettings: GiverConfig): KeyPair => {
  if ("key" in giverSettings) {
    return getKeyPairFromSecret(giverSettings.key);
  }

  if ("phrase" in giverSettings && "accountId" in giverSettings) {
    try {
      return deriveBip39Phrase(giverSettings.phrase, makeBip39Path(giverSettings.accountId));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return deriveTonMnemonic(giverSettings.phrase, makeBip39Path(giverSettings.accountId));
    }
  }

  if ("phrase" in giverSettings && "path" in giverSettings) {
    try {
      return deriveBip39Phrase(giverSettings.phrase, giverSettings.path);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return deriveTonMnemonic(giverSettings.phrase, giverSettings.path);
    }
  }

  throw new Error("You should provide secret key or phrase(with accountId or path) in giver settings");
};
