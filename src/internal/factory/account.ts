import {
  ContractMethod,
  AbiFunctionName,
  AbiFunctionInputs,
  DecodedAbiFunctionOutputs,
  Address,
  Contract,
  ProviderRpcClient,
  MergeInputObjectsArray,
} from "everscale-inpage-provider";

import { Deployer } from "./deployer";
import { ConstructorParams, TransactionWithOutput, Transfer } from "../../types";
import { toNano, errorExtractor } from "../../utils";
import { DeployParams } from "./index";
import { logger } from "../logger";

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

  private static async deployNewAccount<Abi>(
    deployer: Deployer,
    publicKey: string,
    value: string,
    abi: Abi,
    deployParams: DeployParams<Abi>,
    constructorParams: ConstructorParams<Abi>,
  ): Promise<{ account: Account<Abi>; tx: TransactionWithOutput }> {
    const { contract, tx } = await deployer.deployContract(abi, deployParams, constructorParams, value);
    return { account: new Account(contract, publicKey), tx };
  }

  get address(): Address {
    return this.accountContract.address;
  }

  public runTarget = async <TargetAbi>(
    config: {
      contract: Contract<TargetAbi>;
      value?: string;
      bounce?: boolean;
      flags?: number;
    },
    producer?: (
      targetContract: Contract<TargetAbi>,
    ) => ContractMethod<
      AbiFunctionInputs<TargetAbi, AbiFunctionName<TargetAbi>>,
      DecodedAbiFunctionOutputs<TargetAbi, AbiFunctionName<TargetAbi>>
    >,
  ) => {
    return errorExtractor(
      (this.accountContract as unknown as Contract<typeof accountAbiBase>).methods
        .sendTransaction({
          value: config.value || toNano(2),
          bounce: !!config.bounce,
          dest: config.contract.address,
          payload: producer ? await producer(config.contract).encodeInternal() : "",
          flags: config.flags || 0,
        })
        .sendExternal({ publicKey: this.publicKey }),
    );
  };

  public transfer = ({ recipient, value, bounce = false, flags = 0, payload = "" }: Transfer) =>
    errorExtractor(
      (this.accountContract as unknown as Contract<typeof accountAbiBase>).methods
        .sendTransaction({
          value,
          bounce,
          flags,
          dest: recipient,
          payload,
        })
        .sendExternal({ publicKey: this.publicKey }),
    );
}

export type DeployNewAccountParams<Abi> = Abi extends { data: infer D }
  ? {
      tvc?: string;
      workchain?: number;
      publicKey: string;
      initParams: MergeInputObjectsArray<D>;
      constructorParams: ConstructorParams<Abi>;
      value: string;
    }
  : never;

/**
 * @deprecated since version 2.2.0
 * use locklift.factory.accounts instead
 */
export class AccountFactory<Abi> {
  constructor(
    private readonly deployer: Deployer,
    private readonly ever: ProviderRpcClient,
    private readonly abi: Abi,
    private readonly tvc: string,
  ) {
    logger.deprecated({ methodName: "AccountFactory", instruction: "use locklift.factory.accounts instead" });
  }

  getAccount = (accountAddress: Address, publicKey: string): Account<Abi> =>
    Account.getAccount(accountAddress, this.ever, publicKey, this.abi);

  public deployNewAccount = async (
    args: DeployNewAccountParams<Abi>,
  ): Promise<{ account: Account<Abi>; tx: TransactionWithOutput }> => {
    return Account["deployNewAccount"](
      this.deployer,
      args.publicKey,
      args.value,
      this.abi,
      {
        tvc: args.tvc || this.tvc,
        publicKey: args.publicKey,
        initParams: args.initParams,
        workchain: args.workchain,
      } as DeployParams<Abi>,
      args.constructorParams,
    );
  };
}
