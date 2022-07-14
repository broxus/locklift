import { ConstructorParams, Optional, TransactionWithOutput } from "../types";
import { GetExpectedAddressParams, ContractMethod, AbiFunctionName, AbiFunctionInputs, DecodedAbiFunctionOutputs, Address, Contract, ProviderRpcClient } from "everscale-inpage-provider";
import { Deployer } from "./deployer";
export declare const accountAbiBase: {
    readonly functions: readonly [{
        readonly name: "sendTransaction";
        readonly inputs: readonly [{
            readonly name: "dest";
            readonly type: "address";
        }, {
            readonly name: "value";
            readonly type: "uint128";
        }, {
            readonly name: "bounce";
            readonly type: "bool";
        }, {
            readonly name: "flags";
            readonly type: "uint8";
        }, {
            readonly name: "payload";
            readonly type: "cell";
        }];
        readonly outputs: readonly [];
    }];
};
export declare class Account<Abi> {
    readonly accountContract: Contract<Abi>;
    readonly publicKey: string;
    constructor(accountContract: Contract<Abi>, publicKey: string);
    static getAccount: <Abi_1>(accountAddress: Address, ever: ProviderRpcClient, publicKey: string, abi: Abi_1) => Account<Abi_1>;
    static deployNewAccount: <Abi_1>(deployer: Deployer, publicKey: string, value: string, abi: Abi_1, deployParams: GetExpectedAddressParams<Abi_1>, constructorParams: ConstructorParams<Abi_1>) => Promise<{
        account: Account<Abi_1>;
        tx: TransactionWithOutput;
    }>;
    get address(): Address;
    runTarget: <Abi_1>(config: {
        contract: Contract<Abi_1>;
        value?: string | undefined;
        bounce?: boolean | undefined;
        flags?: number | undefined;
    }, producer: (targetContract: Contract<Abi_1>) => ContractMethod<import("everscale-inpage-provider").MergeInputObjectsArray<Extract<Abi_1 extends {
        functions: infer F;
    } ? F extends readonly unknown[] ? import("everscale-inpage-provider/dist/utils").ArrayItemType<F> : never : never, {
        name: AbiFunctionName<Abi_1>;
    }>["inputs"]>, import("everscale-inpage-provider").MergeOutputObjectsArray<Extract<Abi_1 extends {
        functions: infer F;
    } ? F extends readonly unknown[] ? import("everscale-inpage-provider/dist/utils").ArrayItemType<F> : never : never, {
        name: AbiFunctionName<Abi_1>;
    }>["outputs"]>>) => Promise<{
        transaction: import("everscale-inpage-provider").Transaction<Address>;
        output?: {} | undefined;
    }>;
}
export declare class AccountFactory<Abi> {
    private readonly deployer;
    private readonly ever;
    private readonly abi;
    private readonly tvc;
    constructor(deployer: Deployer, ever: ProviderRpcClient, abi: Abi, tvc: string);
    getAccount: (accountAddress: Address, publicKey: string) => Account<Abi>;
    deployNewAccount: (publicKey: string, value: string, deployParams: Optional<GetExpectedAddressParams<Abi>, "tvc">, constructorParams: ConstructorParams<Abi>) => Promise<{
        account: Account<Abi>;
        tx: TransactionWithOutput;
    }>;
}
