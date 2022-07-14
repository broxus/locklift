import { Address, Contract, GetExpectedAddressParams, ProviderRpcClient } from "everscale-inpage-provider";
import { GiverI } from "./giver";
import { ConstructorParams, ContractWithName, DeployTransaction, Optional, TransactionWithOutput } from "../types";
import { AccountFactory } from "./account";
export { Account } from "./account";
export * from "./giver";
export * from "./deployer";
export declare type ContractData<Abi> = {
    code?: string;
    tvc: string;
    abi: Abi;
    hashCode: string;
};
export declare type FactoryType = Record<string, any>;
export declare class Factory<T extends FactoryType> {
    private readonly ever;
    private readonly giver;
    private readonly factoryCache;
    constructor(ever: ProviderRpcClient, giver: GiverI);
    setup: () => Promise<void>;
    private get deployer();
    deployContract: <ContractName extends keyof T>(contractName: ContractName, deployParams: Optional<GetExpectedAddressParams<T[ContractName]>, "tvc">, constructorParams: ConstructorParams<T[ContractName]>, value: string) => Promise<{
        contract: Contract<T[ContractName]>;
    } & {
        tx: TransactionWithOutput;
    }>;
    getAccountsFactory: <ContractName extends keyof T>(contractName: ContractName) => AccountFactory<T[ContractName]>;
    getDeployedContract: <ContractName extends keyof T>(name: ContractName, address: Address) => Contract<T[ContractName]>;
    initializeContract: <key extends keyof T>(name: keyof T, resolvedPath: string) => Promise<ContractData<T[key]>>;
    private getContractsArtifacts;
    getContractArtifacts: <key extends keyof T>(name: key) => ContractData<T[key]>;
    getAllArtifacts: () => Array<{
        contractName: keyof T;
        artifacts: ContractData<T[keyof T]>;
    }>;
    getContractByCodeHash: (codeHash: string, address: Address) => ContractWithName | undefined;
}
