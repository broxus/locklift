import { Contract, GetExpectedAddressParams, ProviderRpcClient } from "everscale-inpage-provider";
import { GiverI } from "./giver";
import { ConstructorParams, TransactionWithOutput } from "../types";
export declare class Deployer {
    private readonly ever;
    private readonly giver;
    constructor(ever: ProviderRpcClient, giver: GiverI);
    deployContract: <Abi extends unknown, T extends [keyof Contract<Abi>]>(abi: Abi, deployParams: GetExpectedAddressParams<Abi>, constructorParams: ConstructorParams<Abi>, value: string) => Promise<{
        contract: Contract<Abi>;
        tx: TransactionWithOutput;
    }>;
}
