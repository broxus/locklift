import { isEqual } from "lodash";

import { accountAbiBase } from "./account";
import { Address } from "everscale-inpage-provider";

export const validateAccountAbi = <Abi>(inputAbi: Abi) => {
  const abi: typeof accountAbiBase = inputAbi as unknown as typeof accountAbiBase;
  const isValidAbi = isEqual(
    accountAbiBase.functions[0],
    abi?.functions?.find(el => el.name === "sendTransaction"),
  );
  if (!isValidAbi) {
    throw new Error(
      `provided not valid abi ${JSON.stringify(abi, null, 4)}, this abi didn't pass constraint ${JSON.stringify(
        accountAbiBase,
        null,
        4,
      )}`,
    );
  }
};

export const tryToDetectContract = (address: Address, codeHash: string) => {
  switch (codeHash) {
    case "84dafa449f98a6987789ba232358072bc0f76dc4524002a5d0918b9a75d2d599":
      return "WalletV3";
    case "0b3a887aeacd2a7d40bb5550bc9253156a029065aefb6d6b583735d58da9d5be":
      return "HighLoadWalletV2";
    case "3ba6528ab2694c118180aa3bd10dd19ff400b909ab4dcf58fc69925b2c7b12a6":
      return "EverWallet";
    default:
      return address.toString();
  }
};

export const emptyContractAbi = {
  "ABI version": 2,
  version: "2.2",
  header: [],
  functions: [],
  events: [],
} as const;
