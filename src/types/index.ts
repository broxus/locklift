import { Contract, Transaction } from "everscale-inpage-provider";

export type ValueOf<T> = T[keyof T];
export type ConstructorParams<Abi> = Parameters<constructorParams<Abi, Contract<Abi>["methods"]>>[0];
type constructorParams<Abi, T extends Contract<Abi>["methods"]> = {
  [key in keyof T]: key extends "constructor" ? T[key] : never;
}[keyof T];
export type ContractWithName<Abi = any> = { contract: Contract<Abi>; name: string };
export type Optional<T extends Record<string, unknown>, K extends keyof T> = Omit<T, K> & { [key in K]?: T[K] };
export type TransactionWithOutput = { transaction: Transaction; output?: Record<string, unknown> | undefined };
export type TransactionParameter = TransactionWithOutput | { tx: TransactionWithOutput };
export type DeployTransaction = Extract<TransactionParameter, { tx: TransactionWithOutput }>;
