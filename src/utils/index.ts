import { Dimensions } from "../constants";
import fs from "fs";
import BigNumber from "bignumber.js";
import { Address, ProviderRpcClient, Transaction } from "everscale-inpage-provider";
import { getPublicKey, KeyPair } from "everscale-crypto";
import { Tracing } from "../tracing";
import { TransactionParameter } from "../types";

export const loadJSONFromFile = (filePath: string): ReturnType<typeof JSON.parse> => {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

export const loadBase64FromFile = (filePath: string): string => {
  return fs.readFileSync(filePath, "utf8").split("\n").join("");
};

export const convertCrystal = (amount: number | string, dimension: Dimensions): string => {
  const crystalBN = new BigNumber(amount);
  switch (dimension) {
    case Dimensions.Nano:
      return crystalBN.times(10 ** 9).toFixed(0);
    case Dimensions.Ton:
      return crystalBN.div(new BigNumber(10).pow(9)).toString();
  }
};

export const getRandomNonce = (): number => (Math.random() * 64000) | 0;

export const errorExtractor = async <T extends { transaction: Transaction<Address>; output?: {} }>(
  transactionResult: Promise<T>,
): Promise<T> => {
  return transactionResult.then((res) => {
    if (res.transaction.aborted) {
      throw {
        message: `Transaction aborted with code ${res.transaction.exitCode}`,
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
  return "tx" in transaction ? transaction.tx.transaction : transaction.transaction;
};
export class Transactions {
  constructor(private readonly provider: ProviderRpcClient, private readonly tracing: Tracing) {}

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
