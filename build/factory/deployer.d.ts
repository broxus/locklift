import { Contract, GetExpectedAddressParams, ProviderRpcClient } from "everscale-inpage-provider";
import { IGiver } from "./giver";
import { ConstructorParams, TransactionWithOutput } from "../types";
export declare class Deployer {
    private readonly ever;
    private readonly giver;
    constructor(ever: ProviderRpcClient, giver: IGiver);
    deployContract: <Abi>(abi: Abi, deployParams: GetExpectedAddressParams<Abi>, constructorParams: ConstructorParams<Abi>, value: string) => Promise<{
        contract: Contract<Abi>;
        tx: TransactionWithOutput;
    }>;
}
