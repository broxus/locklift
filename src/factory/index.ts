import { Address, Contract, GetExpectedAddressParams, ProviderRpcClient } from "everscale-inpage-provider";
import path from "path";
import dirTree from "directory-tree";

import { ConstructorParams, ContractWithName, DeployTransaction, Optional } from "../types";
import * as utils from "../utils";
import { IGiver } from "./giver";
import { AccountFactory } from "./account";
import { Deployer } from "./deployer";
import { validateAccountAbi } from "./utils";
import { flatDirTree } from "../cli/builder/utils";

export { Account } from "./account";
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

export class Factory<T extends FactoryType> {
  private readonly factoryCache: CacheType<T, keyof T> = {} as CacheType<T, keyof T>;

  private constructor(private readonly ever: ProviderRpcClient, private readonly giver: IGiver) {}

  public static async setup<T extends FactoryType>(ever: ProviderRpcClient, giver: IGiver): Promise<Factory<T>> {
    const factory = new Factory<T>(ever, giver);
    await factory.getContractsArtifacts().then(artifacts => {
      artifacts.forEach(({ artifacts, contractName }) => {
        factory.factoryCache[contractName] = artifacts;
      });
    });
    return factory;
  }

  private get deployer() {
    return new Deployer(this.ever, this.giver);
  }

  public deployContract = async <ContractName extends keyof T>(
    contractName: ContractName,
    deployParams: Optional<GetExpectedAddressParams<T[ContractName]>, "tvc">,
    constructorParams: ConstructorParams<T[ContractName]>,
    value: string,
  ): Promise<{ contract: Contract<T[ContractName]> } & DeployTransaction> => {
    const { tvc, abi } = this.getContractArtifacts(contractName as ContractName);
    return this.deployer.deployContract(
      abi,
      { ...deployParams, tvc: deployParams.tvc || tvc } as GetExpectedAddressParams<T[ContractName]>,
      constructorParams,
      value,
    );
  };

  public getAccountsFactory<ContractName extends keyof T>(contractName: ContractName) {
    const { tvc, abi } = this.getContractArtifacts(contractName as ContractName);
    validateAccountAbi(abi);
    return new AccountFactory(this.deployer, this.ever, abi, tvc);
  }

  public getDeployedContract = <ContractName extends keyof T>(
    name: ContractName,
    address: Address,
  ): Contract<T[ContractName]> => {
    return new this.ever.Contract(this.getContractArtifacts(name as ContractName).abi, address);
  };

  public initializeContract = async <key extends keyof T>(
    name: keyof T,
    resolvedPath: string,
  ): Promise<ContractData<T[key]>> => {
    const tvc = utils.loadBase64FromFile(path.resolve(resolvedPath, (name as string) + ".base64"));
    const abi = utils.loadJSONFromFile(path.resolve(resolvedPath, (name as string) + ".abi.json"));
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

  public getContractArtifacts<key extends keyof T>(name: key): ContractData<T[key]> {
    return this.factoryCache[name] as ContractData<T[key]>;
  }

  public getAllArtifacts(): Array<{ contractName: keyof T; artifacts: ContractData<T[keyof T]> }> {
    return Object.entries(this.factoryCache).map(([contractName, artifacts]) => ({
      contractName,
      artifacts,
    })) as unknown as Array<{ contractName: keyof T; artifacts: ContractData<T[keyof T]> }>;
  }

  public getContractByCodeHash = (codeHash: string, address: Address): ContractWithName | undefined => {
    const contractArtifacts = this.getAllArtifacts().find(({ artifacts }) => artifacts.codeHash === codeHash);

    return (
      contractArtifacts && {
        contract: this.getDeployedContract(contractArtifacts.contractName, address),
        name: contractArtifacts.contractName as string,
      }
    );
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
