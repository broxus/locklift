import { isEqual } from "lodash";

import { accountAbiBase } from "./account";

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
