import { Address, Contract, GetExpectedAddressParams, ProviderRpcClient } from "everscale-inpage-provider";
import path from "path";
import dirTree from "directory-tree";

import { ConstructorParams, ContractWithName, DeployTransaction, Optional } from "../../types";
import * as utils from "../../utils";
import { Giver } from "./giver";
import { AccountFactory } from "./account";
import { Deployer } from "./deployer";
import { emptyContractAbi, tryToDetectContract, validateAccountAbi } from "./utils";
import { flatDirTree } from "../cli/builder/utils";
import { AccountFactory2 } from "./account2";
import { SimpleAccountsStorage } from "everscale-standalone-client/nodejs";

export { Account, AccountFactory } from "./account";
export * from "./giver";
export * from "./deployer";

export type ContractData<Abi> = {
  code: string;
  tvc: string;
  abi: Abi;
  codeHash: string;
};

type CacheType<T extends FactoryType, key extends keyof T> = Record<key, ContractData<key>>;

export type FactoryType = Record<string, any>;

export type DeployContractParams<T extends FactoryType, ContractName extends keyof T> = {
  contract: ContractName;
  constructorParams: ConstructorParams<T[ContractName]>;
  value: string;
} & Optional<DeployParams<T[ContractName]>, "tvc">;

export type DeployParams<Abi> = GetExpectedAddressParams<Abi> & { publicKey: string };

export class Factory<T extends FactoryType> {
  private readonly factoryCache: CacheType<T, keyof T> = {} as CacheType<T, keyof T>;
  public accounts: AccountFactory2<T>;
  private constructor(
    private readonly ever: ProviderRpcClient,
    private readonly giver: () => Giver,
    private readonly accountsStorage: SimpleAccountsStorage,
  ) {
    this.accounts = new AccountFactory2(this, (...params) => giver().sendTo(...params), accountsStorage);
  }

  public static async setup<T extends FactoryType>(
    ever: ProviderRpcClient,
    giver: () => Giver,
    accountsStorage: SimpleAccountsStorage,
  ): Promise<Factory<T>> {
    const factory = new Factory<T>(ever, giver, accountsStorage);
    await factory.getContractsArtifacts().then(artifacts => {
      artifacts.forEach(({ artifacts, contractName }) => {
        factory.factoryCache[contractName] = artifacts;
      });
    });
    return factory;
  }

  private get deployer() {
    return new Deployer(this.ever, this.giver());
  }

  public deployContract = async <ContractName extends keyof T>(
    args: DeployContractParams<T, ContractName>,
  ): Promise<{ contract: Contract<T[ContractName]> } & DeployTransaction> => {
    const { tvc, abi } = this.getContractArtifacts(args.contract);
    return this.deployer.deployContract(
      abi,
      {
        tvc: args.tvc || tvc,
        workchain: args.workchain,
        publicKey: args.publicKey,
        initParams: args.initParams,
      } as DeployParams<T[ContractName]>,
      args.constructorParams,
      args.value,
    );
  };

  public getAccountsFactory = <ContractName extends keyof T>(contractName: ContractName) => {
    const { tvc, abi } = this.getContractArtifacts(contractName as ContractName);
    validateAccountAbi(abi);
    return new AccountFactory(this.deployer, this.ever, abi, tvc);
  };

  public getDeployedContract = <ContractName extends keyof T>(
    name: ContractName,
    address: Address,
  ): Contract<T[ContractName]> => {
    return new this.ever.Contract(this.getContractArtifacts(name as ContractName)?.abi, address);
  };

  public initializeContract = async <key extends keyof T>(
    name: keyof T,
    resolvedPath: string,
  ): Promise<ContractData<T[key]>> => {
    const tvc =
      utils.tryLoadTvcFromFile(path.resolve(resolvedPath, (name as string) + ".tvc")) ||
      utils.loadBase64FromFile(path.resolve(resolvedPath, (name as string) + ".base64"));

    if (!tvc) {
      throw new Error(`Not found TVC of Contract ${name as string}, need to provide .tvc or .base64 sources`);
    }

    const abi = utils.loadJSONFromFile(path.resolve(resolvedPath, (name as string) + ".abi.json"));

    if (!abi) {
      throw new Error(`Not found ABI of Contract ${name as string}`);
    }

    const { code } = await this.ever.splitTvc(tvc);
    if (code == null) {
      throw new Error(`Contract TVC ${name as string} doesn't contain code`);
    }

    const codeHash = await this.ever.getBocHash(code);

    return {
      tvc,
      code,
      abi,
      codeHash,
    };
  };

  public getContractArtifacts = <key extends keyof T>(name: key): ContractData<T[key]> => {
    return this.factoryCache[name] as ContractData<T[key]>;
  };

  public getAllArtifacts = (): Array<{ contractName: keyof T; artifacts: ContractData<T[keyof T]> }> => {
    return Object.entries(this.factoryCache).map(([contractName, artifacts]) => ({
      contractName,
      artifacts,
    })) as unknown as Array<{ contractName: keyof T; artifacts: ContractData<T[keyof T]> }>;
  };

  public getContractByCodeHash = (codeHash: string, address: Address): ContractWithName | undefined => {
    const contractArtifacts = this.getAllArtifacts().find(({ artifacts }) => artifacts.codeHash === codeHash);

    return (
      contractArtifacts && {
        contract: this.getDeployedContract(contractArtifacts.contractName, address),
        name: contractArtifacts.contractName as string,
      }
    );
  };

  public getContractByCodeHashOrDefault = (codeHash: string, address: Address): ContractWithName => {
    const existingContract = this.getContractByCodeHash(codeHash, address);
    if (existingContract) {
      return existingContract;
    }
    const contractName = tryToDetectContract(address, codeHash);
    return {
      contract: new this.ever.Contract(emptyContractAbi, address),
      name: contractName,
    };
  };

  private async getContractsArtifacts(): Promise<{ artifacts: ContractData<T[keyof T]>; contractName: keyof T }[]> {
    const resolvedBuildPath = path.resolve(process.cwd(), "build");
    const contractsNestedTree = dirTree(resolvedBuildPath, {
      extensions: /\.json/,
    });
    const contractNames = flatDirTree(contractsNestedTree)?.map(el => el.name.slice(0, -9)) as Array<keyof T>;
    return await Promise.all(
      contractNames.map(async contractName => ({
        artifacts: await this.initializeContract(contractName, resolvedBuildPath),
        contractName,
      })),
    );
  }
}
