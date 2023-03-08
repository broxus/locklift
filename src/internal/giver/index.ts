import { GiverConfig } from "../config";
import { Address, ProviderRpcClient } from "everscale-inpage-provider";
import { Giver } from "../factory";
import {
  Account,
  EverWalletAccount,
  GiverAccount,
  HighloadWalletV2,
  MsigAccount,
  SimpleAccountsStorage,
  WalletV3Account,
} from "everscale-standalone-client/nodejs";
import BigNumber from "bignumber.js";
import { getGiverKeyPair } from "./utils";
import { GiverFromAccount, TestnetGiver } from "./giverOptions";
import { GiverTypes } from "./constants";
import { fromNano } from "../../utils";
import { logger } from "../logger";
const logGiverFactory = (giverBalance: string) => (walletName: string) =>
  logger.printInfo(`${walletName} is used as a giver, the giver balance is: ${giverBalance} ever`);
export const getGiver = async (
  giverConfig: GiverConfig,
  provider: ProviderRpcClient,
  accountStorage: SimpleAccountsStorage,
): Promise<Giver | undefined> => {
  const giverKeyPair = getGiverKeyPair(giverConfig);
  if (giverConfig.giverFactory) {
    return giverConfig.giverFactory(provider, giverKeyPair, giverConfig.address);
  }
  const giverAddress = new Address(giverConfig.address);
  const giverState = await provider
    .getFullContractState({
      address: giverAddress,
    })
    .then(res => res.state);
  if (!giverState) {
    throw new Error("Giver has empty contract state, check the giver address");
  }
  const logGiver = logGiverFactory(fromNano(giverState.balance));

  if (!giverState.isDeployed) {
    const wallets: Array<{
      walletName: string;
      wallet: {
        computeAddress(args: { publicKey: string | BigNumber; workchain?: number }): Promise<Address>;
        fromPubkey(args: { publicKey: string; workchain?: number }): Promise<Account>;
      };
    }> = [
      { wallet: WalletV3Account, walletName: "WalletV3" },
      { wallet: EverWalletAccount, walletName: "EverWallet" },
      { wallet: HighloadWalletV2, walletName: "HighloadWalletV2" },
    ];
    for (const { wallet, walletName } of wallets) {
      if (
        await wallet
          .computeAddress({
            publicKey: giverKeyPair.publicKey,
          })
          .then(res => res.equals(giverAddress))
      ) {
        accountStorage.addAccount(
          await wallet.fromPubkey({
            publicKey: giverKeyPair.publicKey,
          }),
        );
        logGiver(walletName);
        return new GiverFromAccount(provider, giverAddress);
      }
    }
    throw new Error("Public key doesn't match by WalletV3, EverWallet, HighloadWalletV2 addresses");
  }
  const giverType = Object.entries(GiverTypes).find(
    ([, codeHash]) => codeHash === giverState.codeHash,
  )?.[1] as GiverTypes;
  if (!giverType) {
    throw new Error("Introduced giver doesn't match by known givers");
  }
  switch (giverType) {
    case GiverTypes.MainGiver:
      logGiver("MainGiver");
      return new TestnetGiver(provider, giverKeyPair, giverAddress);
    case GiverTypes.WalletV3:
      logGiver("WalletV3");
      accountStorage.addAccount(new WalletV3Account(giverAddress));
      return new GiverFromAccount(provider, giverAddress);

    case GiverTypes.EverWallet:
      logGiver("EverWallet");
      accountStorage.addAccount(new EverWalletAccount(giverAddress));
      return new GiverFromAccount(provider, giverAddress);

    case GiverTypes.HighloadWalletV2:
      logGiver("HighloadWalletV2");
      accountStorage.addAccount(new HighloadWalletV2(giverAddress));
      return new GiverFromAccount(provider, giverAddress);

    case GiverTypes.SafeMultisig:
    case GiverTypes.SurfWallet:
    case GiverTypes.SafeMultisig24:
    case GiverTypes.SetCodeMultisig:
    case GiverTypes.BridgeMultisig:
      logGiver("SafeMultisig");
      accountStorage.addAccount(
        new MsigAccount({
          publicKey: giverKeyPair.publicKey,
          address: giverAddress,
          type: "SafeMultisig",
        }),
      );
      return new GiverFromAccount(provider, giverAddress);

    case GiverTypes.Multisig_2_1:
      logGiver("multisig2");
      accountStorage.addAccount(
        new MsigAccount({
          publicKey: giverKeyPair.publicKey,
          address: giverAddress,
          type: "multisig2",
        }),
      );
      return new GiverFromAccount(provider, giverAddress);

    case GiverTypes.GiverV3:
    case GiverTypes.GiverV2: {
      logGiver("GiverV2");
      accountStorage.addAccount(
        new GiverAccount({
          publicKey: giverKeyPair.publicKey,
          address: giverAddress,
        }),
      );
      return new GiverFromAccount(provider, giverAddress);
    }
  }
};
