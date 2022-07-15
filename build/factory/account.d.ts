import { GetExpectedAddressParams, ContractMethod, AbiFunctionName, AbiFunctionInputs, DecodedAbiFunctionOutputs, Address, Contract, ProviderRpcClient } from "everscale-inpage-provider";
import { Deployer } from "./deployer";
import { ConstructorParams, Optional, TransactionWithOutput } from "../types";
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
    static getAccount<Abi>(accountAddress: Address, ever: ProviderRpcClient, publicKey: string, abi: Abi): Account<Abi>;
    static deployNewAccount<Abi>(deployer: Deployer, publicKey: string, value: string, abi: Abi, deployParams: GetExpectedAddressParams<Abi>, constructorParams: ConstructorParams<Abi>): Promise<{
        account: Account<Abi>;
        tx: TransactionWithOutput;
    }>;
    get address(): Address;
    runTarget(config: {
        contract: Contract<Abi>;
        value?: string;
        bounce?: boolean;
        flags?: number;
    }, producer: (targetContract: Contract<Abi>) => ContractMethod<AbiFunctionInputs<Abi, AbiFunctionName<Abi>>, DecodedAbiFunctionOutputs<Abi, AbiFunctionName<Abi>>>): Promise<{
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
