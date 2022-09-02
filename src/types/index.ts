import { Address, Contract, Transaction } from "everscale-inpage-provider";
import { Account } from "everscale-standalone-client/nodejs";

export type ValueOf<T> = T[keyof T];
export type ConstructorParams<Abi> = Parameters<constructorParams<Abi, Contract<Abi>["methods"]>>[0];
type constructorParams<Abi, T extends Contract<Abi>["methods"]> = {
  [key in keyof T]: key extends "constructor" ? T[key] : never;
}[keyof T];
export type ContractWithName<Abi = any> = { contract: Contract<Abi>; name: string };
export type Optional<T extends Record<string, unknown>, K extends keyof T> = Omit<T, K> & { [key in K]?: T[K] };
export type TransactionWithOutput = { transaction: Transaction; output?: Record<string, unknown> | undefined };
export type TransactionParameter = TransactionWithOutput | { tx: TransactionWithOutput } | Transaction;
export type DeployTransaction = Extract<TransactionParameter, { tx: TransactionWithOutput }>;
export type Transfer = {
  recipient: Address;
  value: string;
  bounce?: boolean;
  flags?: number;
  payload?: string;
};

export enum WalletTypes {
  /**
   * WalletV3
   */
  WalletV3,
  /**
   * HighLoadWalletV2
   */
  HighLoadWalletV2,
  /**
   * Any account which supports Giver ABI (GiverV2, SafeMultisig, SetcodeMultisig, Surf):
   *
   * ```
   * {
   *   "ABI version": 2,
   *   "header": ["pubkey", "time", "expire"],
   *   "functions": [{
   *     "name": "sendTransaction",
   *     "inputs": [
   *       {"name":"dest","type":"address"},
   *       {"name":"value","type":"uint128"},
   *       {"name":"bounce","type":"bool"},
   *       {"name":"flags","type":"uint8"},
   *       {"name":"payload","type":"cell"}
   *     ],
   *     "outputs": []
   *   }],
   *   "events": []
   * }
   * ```
   */
  MsigAccount,
}
export type CreateAccountOutput = {
  account: Account;
  tx: TransactionWithOutput;
};
