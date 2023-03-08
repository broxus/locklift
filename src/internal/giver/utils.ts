import { GiverConfig } from "../config";
import { deriveBip39Phrase, KeyPair, makeBip39Path } from "everscale-crypto";
import { getKeyPairFromSecret } from "../../utils";

export const getGiverKeyPair = (giverSettings: GiverConfig): KeyPair => {
  if ("key" in giverSettings) {
    return getKeyPairFromSecret(giverSettings.key);
  }
  if ("phrase" in giverSettings && "accountId" in giverSettings) {
    return deriveBip39Phrase(giverSettings.phrase, makeBip39Path(giverSettings.accountId));
  }
  throw new Error("You should provide secret key or phrase(with accountId) in giver settings");
};
