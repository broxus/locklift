import fs from "fs";
import BigNumber from "bignumber.js";
import { ProviderRpcClient, Transaction } from "everscale-inpage-provider";
import { getPublicKey, KeyPair } from "everscale-crypto";

import { Dimension } from "../constants";
import { TransactionParameter } from "../types";

export const loadJSONFromFile = (filePath: string): ReturnType<typeof JSON.parse> | undefined => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    return undefined;
  }
};

export const loadBase64FromFile = (filePath: string): string | undefined => {
  try {
    return fs.readFileSync(filePath, "utf8").split("\n").join("");
  } catch (e) {
    return undefined;
  }
};

export const tryLoadTvcFromFile = (filePath: string): string | undefined => {
  try {
    return fs.readFileSync(filePath, "base64");
  } catch (e) {
    return;
  }
};

export const toNano = (amount: number | string): string => new BigNumber(amount).shiftedBy(9).toFixed(0);
export const fromNano = (amount: number | string): string => new BigNumber(amount).shiftedBy(-9).toString();
export const isValidEverAddress = (address: string) => /^(?:-1|0):[0-9a-fA-F]{64}$/.test(address);
export const stringToBytesArray = (dataString: string, encoding: BufferEncoding = "base64") => {
  return Buffer.from(dataString).toString(encoding);
};
export const convertAmount = (amount: number | string, dimension: Dimension): string => {
  const crystalBN = new BigNumber(amount);
  switch (dimension) {
    case Dimension.ToNano:
      return crystalBN.times(10 ** 9).toFixed(0);
    case Dimension.FromNano:
      return crystalBN.div(new BigNumber(10).pow(9)).toString();
  }
};

export const getRandomNonce = (): number => (Math.random() * 64000) | 0;

export const errorExtractor = async <T extends { transaction: Transaction; output?: Record<string, unknown> }>(
  transactionResult: Promise<T>,
): Promise<T> => {
  return transactionResult.then(res => {
    if (res.transaction.aborted) {
      throw {
        message: `Transaction aborted with code ${res.transaction.exitCode}`,
        name: "TransactionAborted",
        transaction: res,
      };
    }
    return res;
  });
};

export const getKeyPairFromSecret = (secretKey: string): KeyPair => {
  return {
    secretKey,
    publicKey: getPublicKey(secretKey),
  };
};

export const extractTransactionFromParams = (transaction: TransactionParameter): Transaction => {
  if ("tx" in transaction) {
    return transaction.tx.transaction;
  }
  if ("transaction" in transaction) {
    return transaction.transaction;
  }
  return transaction;
};

export class Transactions {
  constructor(private readonly provider: ProviderRpcClient) {}

  public waitFinalized = async <T extends TransactionParameter>(transactionProm: Promise<T>): Promise<T> => {
    const transaction = await transactionProm;
    const subscription = new this.provider.Subscriber();
    return subscription
      .trace(extractTransactionFromParams(transaction))
      .finished()
      .then(subscription.unsubscribe.bind(subscription))
      .then(() => transaction);
  };
}
