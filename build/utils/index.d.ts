import { Dimensions } from "../constants";
import { Address, ProviderRpcClient, Transaction } from "everscale-inpage-provider";
import { KeyPair } from "everscale-crypto";
import { Tracing } from "../tracing";
import { TransactionParameter } from "../types";
export declare const loadJSONFromFile: (filePath: string) => ReturnType<typeof JSON.parse>;
export declare const loadBase64FromFile: (filePath: string) => string;
export declare const convertCrystal: (amount: number | string, dimension: Dimensions) => string;
export declare const getRandomNonce: () => number;
export declare const errorExtractor: <T extends {
    transaction: Transaction<Address>;
    output?: Record<string, unknown> | undefined;
}>(transactionResult: Promise<T>) => Promise<T>;
export declare const getKeyPairFromSecret: (secretKey: string) => KeyPair;
export declare const extractTransactionFromParams: (transaction: TransactionParameter) => Transaction;
export declare class Transactions {
    private readonly provider;
    private readonly tracing;
    constructor(provider: ProviderRpcClient, tracing: Tracing);
    waitFinalized: <T extends TransactionParameter>(transactionProm: Promise<T>) => Promise<T>;
}
