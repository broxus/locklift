import { LockliftNetwork } from "@broxus/locklift-network";
import { Address, Contract, ProviderRpcClient } from "everscale-inpage-provider";
import { Account, MsigAccount, SimpleAccountsStorage } from "everscale-standalone-client/nodejs";
import { LOCKLIFT_WALLET_BOC } from "./lockliftWallet/boc";
import { Signer } from "everscale-standalone-client";
import { AccountFetcherResponse } from "@broxus/locklift-network/types";
import { zeroAddress } from "../../constants";

export class Network {
  constructor(
    private readonly proxyNetwork: LockliftNetwork,
    private readonly signer: Signer,
    private readonly accountStorage: SimpleAccountsStorage,
    private readonly provider: ProviderRpcClient,
  ) {}

  insertWallet = (address: Address): Account => {
    this.proxyNetwork.setAccount(address, LOCKLIFT_WALLET_BOC, "accountStuffBoc");
    const lockliftWallet = new MsigAccount({
      address,
      type: "SafeMultisig",
      publicKey: this.signer.publicKey,
    });
    this.accountStorage.addAccount(lockliftWallet);
    return lockliftWallet;
  };

  insertAccount = <T>({
    boc,
    address,
    abi,
    type,
  }: {
    address: Address;
    boc: string;
    abi: T;
    type?: AccountFetcherResponse["type"];
  }): Contract<T> => {
    this.proxyNetwork.setAccount(address, boc, type || "accountStuffBoc");
    return new this.provider.Contract(abi, address);
  };

  getWallet = (id: number) => {
    const address = getLockliftWalletAddress(id.toString());
    return this.insertWallet(new Address(address));
  };

  getWallets = (count: number) => {
    return Array.from({ length: count }, (_, i) => {
      return this.getWallet(i);
    });
  };
}

const getLockliftWalletAddress = (id = "0") => {
  const [, addressTail] = zeroAddress.toString().split(":");
  return `${0}:777${addressTail}`.slice(0, zeroAddress.toString().length - id.length).concat(id);
};
