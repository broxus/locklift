import { ProviderRpcClient } from "everscale-inpage-provider";
import { AllowedCodes, TraceParams } from "./types";
import { Factory } from "../factory";
import { TracingInternal } from "./tracingInternal";
import { Transactions } from "../utils";
import { TransactionParameter } from "../types";
export declare class Tracing {
    private readonly ever;
    private readonly tracingInternal;
    private readonly features;
    constructor(ever: ProviderRpcClient, tracingInternal: TracingInternal, features: Transactions);
    trace: <T extends TransactionParameter>(transactionProm: Promise<T>, config: Omit<TraceParams, "inMsgId">) => Promise<T>;
    get allowedCodes(): AllowedCodes;
    setAllowCodes: (params: Parameters<typeof this.tracingInternal.setAllowCodes>) => void;
    allowCodesForAddress: (params: [address: string, allowedCodes?: import("./types").OptionalContracts | undefined]) => void;
    removeAllowedCodesForAddress: (params: [address: string, allowedCodes?: import("./types").OptionalContracts | undefined]) => void;
    removeAllowedCodes: (params: Parameters<typeof this.tracingInternal.removeAllowedCodes>) => void;
}
export declare const createTracing: ({ ever, factory, features, endpoint, }: {
    ever: ProviderRpcClient;
    factory: Factory<any>;
    features: Transactions;
    endpoint?: string | undefined;
}) => Tracing;
