import { ProviderRpcClient } from "everscale-inpage-provider";
import { Clock, SimpleKeystore } from "everscale-standalone-client/nodejs";
import { ConfigState, LockliftConfig } from "./config";
import * as utils from "./utils";
import { IGiver } from "./factory";
import { Factory } from "./factory";
import { Transactions } from "./utils";
import { Tracing } from "./tracing";
export * from "everscale-inpage-provider";
export { Dimension, zeroAddress } from "./constants";
export type { LockliftConfig } from "./config";
export declare class Locklift<FactorySource = any> {
    readonly factory: Factory<FactorySource>;
    readonly giver: IGiver;
    readonly provider: ProviderRpcClient;
    readonly clock: Clock;
    readonly keystore: SimpleKeystore;
    readonly transactions: Transactions;
    readonly tracing: Tracing;
    readonly utils: typeof utils;
    private constructor();
    static setup<T>(config: LockliftConfig<ConfigState.INTERNAL>, network?: keyof LockliftConfig["networks"]): Promise<Locklift<T>>;
}
