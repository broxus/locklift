import { ConfigState, LockliftConfig, NetworkValue } from "./config";
import * as utils from "./utils";
import { GiverI } from "./factory";
export { GiverI } from "./factory/giver";
import { Provider } from "./provider";
import { Factory } from "./factory";
import { Transactions } from "./utils";
import { Tracing } from "./tracing";
export * from "everscale-inpage-provider";
export { Dimensions, zeroAddress } from "./constants";
export declare class Locklift<FactorySource = any> {
    private readonly config;
    private readonly network;
    networkConfig: NetworkValue<ConfigState.INTERNAL>;
    factory: Factory<FactorySource>;
    giver: GiverI;
    utils: typeof utils;
    transactions: Transactions;
    provider: Provider;
    tracing: Tracing;
    constructor(config: LockliftConfig<ConfigState.INTERNAL>, network?: keyof LockliftConfig["networks"]);
    setup(): Promise<void>;
}
