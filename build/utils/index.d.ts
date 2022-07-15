import { ProviderRpcClient, Transaction } from "everscale-inpage-provider";
import { KeyPair } from "everscale-crypto";
import { Dimension } from "../constants";
import { TransactionParameter } from "../types";
export declare const loadJSONFromFile: (filePath: string) => ReturnType<typeof JSON.parse>;
export declare const loadBase64FromFile: (filePath: string) => string;
export declare const toNano: (amount: number | string) => string;
export declare const fromNano: (amount: number | string) => string;
export declare const convertAmount: (amount: number | string, dimension: Dimension) => string;
export declare const getRandomNonce: () => number;
export declare const errorExtractor: <T extends {
    transaction: Transaction;
    output?: Record<string, unknown> | undefined;
}>(transactionResult: Promise<T>) => Promise<T>;
export declare const getKeyPairFromSecret: (secretKey: string) => KeyPair;
export declare const extractTransactionFromParams: (transaction: TransactionParameter) => Transaction;
export declare class Transactions {
    private readonly provider;
    constructor(provider: ProviderRpcClient);
    waitFinalized: <T extends TransactionParameter>(transactionProm: Promise<T>) => Promise<T>;
}
