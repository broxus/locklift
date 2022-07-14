import { Contract, GetExpectedAddressParams, ProviderRpcClient } from "everscale-inpage-provider";
import { GiverI } from "./giver";
import { errorExtractor } from "../utils";
import { ConstructorParams, TransactionWithOutput } from "../types";

export class Deployer {
  constructor(private readonly ever: ProviderRpcClient, private readonly giver: GiverI) {}
  deployContract = async <Abi extends any, T extends [keyof Contract<Abi>]>(
    abi: Abi,
    deployParams: GetExpectedAddressParams<Abi>,
    constructorParams: ConstructorParams<Abi>,
    value: string,
  ): Promise<{ contract: Contract<Abi>; tx: TransactionWithOutput }> => {
    const expectedAddress = await this.ever.getExpectedAddress(abi, deployParams);
    await errorExtractor(this.giver.sendTo(expectedAddress, value));
    const contract = new this.ever.Contract(abi, expectedAddress);
    const stateInit = await this.ever.getStateInit(abi, deployParams);
    const tx = await errorExtractor(
      contract.methods.constructor(constructorParams).sendExternal({
        stateInit: stateInit.stateInit,
        publicKey: deployParams.publicKey,
      }),
    );

    return { contract, tx };
  };
}
