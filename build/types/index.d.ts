import { Contract, Transaction } from "everscale-inpage-provider";
export declare type ValueOf<T> = T[keyof T];
export declare type ConstructorParams<Abi> = Parameters<constructorParams<Abi, Contract<Abi>["methods"]>>[0];
declare type constructorParams<Abi, T extends Contract<Abi>["methods"]> = {
    [key in keyof T]: key extends "constructor" ? T[key] : never;
}[keyof T];
export declare type ContractWithName<Abi = any> = {
    contract: Contract<Abi>;
    name: string;
};
export declare type Optional<T extends Record<string, unknown>, K extends keyof T> = Omit<T, K> & {
    [key in K]?: T[K];
};
export declare type TransactionWithOutput = {
    transaction: Transaction;
    output?: Record<string, unknown> | undefined;
};
export declare type TransactionParameter = TransactionWithOutput | {
    tx: TransactionWithOutput;
};
export declare type DeployTransaction = Extract<TransactionParameter, {
    tx: TransactionWithOutput;
}>;
export {};
