import {
  GetExpectedAddressParams,
  ContractMethod,
  AbiFunctionName,
  AbiFunctionInputs,
  DecodedAbiFunctionOutputs,
  Address,
  Contract,
  ProviderRpcClient,
} from "everscale-inpage-provider";

import { Deployer } from "./deployer";
import { ConstructorParams, Optional, TransactionWithOutput } from "../types";
import { toNano, errorExtractor } from "../utils";

export const accountAbiBase = {
  functions: [
    {
      name: "sendTransaction",
      inputs: [
        { name: "dest", type: "address" },
        { name: "value", type: "uint128" },
        { name: "bounce", type: "bool" },
        { name: "flags", type: "uint8" },
        { name: "payload", type: "cell" },
      ],
      outputs: [],
    },
  ],
} as const;

export class Account<Abi> {
  constructor(readonly accountContract: Contract<Abi>, readonly publicKey: string) {}

  public static getAccount<Abi>(
    accountAddress: Address,
    ever: ProviderRpcClient,
    publicKey: string,
    abi: Abi,
  ): Account<Abi> {
    return new Account(new ever.Contract(abi, accountAddress), publicKey);
  }

  public static async deployNewAccount<Abi>(
    deployer: Deployer,
    publicKey: string,
    value: string,
    abi: Abi,
    deployParams: GetExpectedAddressParams<Abi>,
    constructorParams: ConstructorParams<Abi>,
  ): Promise<{ account: Account<Abi>; tx: TransactionWithOutput }> {
    const { contract, tx } = await deployer.deployContract(abi, deployParams, constructorParams, value);
    return { account: new Account(contract, publicKey), tx };
  }

  get address(): Address {
    return this.accountContract.address;
  }

  public async runTarget(
    config: {
      contract: Contract<Abi>;
      value?: string;
      bounce?: boolean;
      flags?: number;
    },
    producer: (
      targetContract: Contract<Abi>,
    ) => ContractMethod<
      AbiFunctionInputs<Abi, AbiFunctionName<Abi>>,
      DecodedAbiFunctionOutputs<Abi, AbiFunctionName<Abi>>
    >,
  ) {
    return errorExtractor(
      (this.accountContract as unknown as Contract<typeof accountAbiBase>).methods
        .sendTransaction({
          value: config.value || toNano(2),
          bounce: !!config.bounce,
          dest: config.contract.address,
          payload: await producer(config.contract).encodeInternal(),
          flags: config.flags || 0,
        })
        .sendExternal({ publicKey: this.publicKey }),
    );
  }
}

export class AccountFactory<Abi> {
  constructor(
    private readonly deployer: Deployer,
    private readonly ever: ProviderRpcClient,
    private readonly abi: Abi,
    private readonly tvc: string,
  ) {}

  getAccount = (accountAddress: Address, publicKey: string): Account<Abi> =>
    Account.getAccount(accountAddress, this.ever, publicKey, this.abi);
  deployNewAccount = async (
    publicKey: string,
    value: string,
    deployParams: Optional<GetExpectedAddressParams<Abi>, "tvc">,
    constructorParams: ConstructorParams<Abi>,
  ): Promise<{ account: Account<Abi>; tx: TransactionWithOutput }> =>
    Account.deployNewAccount(
      this.deployer,
      publicKey,
      value,
      this.abi,
      { ...deployParams, tvc: deployParams.tvc || this.tvc } as GetExpectedAddressParams<Abi>,
      constructorParams,
    );
}
