import { LockliftNetwork } from "@broxus/locklift-network";
import { Address, Contract, ProviderRpcClient } from "everscale-inpage-provider";
import { Account, MsigAccount, SimpleAccountsStorage } from "everscale-standalone-client/nodejs";
import { LOCKLIFT_WALLET_BOC } from "./lockliftWallet/sources/boc";
import { LockliftWallet } from "./lockliftWallet";
import { Signer } from "everscale-standalone-client";

export class Network {
  constructor(
    private readonly proxyNetwork: LockliftNetwork,
    private readonly signer: Signer,
    private readonly accountStorage: SimpleAccountsStorage,
    private readonly provider: ProviderRpcClient,
  ) {}

  insertWallet = (address: Address): Account => {
    this.proxyNetwork._executor.setAccount(address, LOCKLIFT_WALLET_BOC);
    const lockliftWallet = new MsigAccount({
      address,
      type: "SafeMultisig",
      publicKey: this.signer.publicKey,
    });
    this.accountStorage.addAccount(lockliftWallet);
    return lockliftWallet;
  };

  insertAccount = <T>({ boc, address, abi }: { address: Address; boc: string; abi: T }): Contract<T> => {
    this.proxyNetwork._executor.setAccount(address, boc);
    return new this.provider.Contract(abi, address);
  };
}
