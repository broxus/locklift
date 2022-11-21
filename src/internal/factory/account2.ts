import { ContractData, DeployContractParams, FactoryType, Giver } from "./index";
import { Address, Contract } from "everscale-inpage-provider";
import { CreateAccountOutput, DeployTransaction, WalletTypes } from "../../types";
import {
  Account,
  EverWalletAccount,
  HighloadWalletV2,
  MsigAccount,
  SimpleAccountsStorage,
  WalletV3Account,
} from "everscale-standalone-client/nodejs";
import { validateAccountAbi } from "./utils";

type MSigType = ConstructorParameters<typeof MsigAccount>[0]["type"];

type CreateAccountParams<T extends FactoryType> =
  | {
      type: WalletTypes.WalletV3 | WalletTypes.HighLoadWalletV2;
      publicKey: string;
      value: string;
    }
  | {
      type: WalletTypes.EverWallet;
      publicKey: string;
      value: string;
      nonce?: number;
    }
  | ({ type: WalletTypes.MsigAccount } & DeployContractParams<T, keyof T> & {
        mSigType: MSigType;
      });

type AddExistingAccountParams =
  | { type: WalletTypes.HighLoadWalletV2 | WalletTypes.WalletV3; publicKey: string }
  | { type: WalletTypes.EverWallet; address: Address }
  | { type: WalletTypes.MsigAccount; publicKey?: string; address: Address; mSigType: MSigType };

/*
AccountFactory2 is service based on everscale-standalone-client SimpleAccountsStorage
 */
export class AccountFactory2<T extends FactoryType> {
  constructor(
    private readonly sourceFactory: {
      getContractArtifacts: <key extends keyof T>(name: key) => ContractData<T[key]>;
      deployContract: <ContractName extends keyof T>(
        args: DeployContractParams<T, ContractName>,
      ) => Promise<{ contract: Contract<T[ContractName]> } & DeployTransaction>;
    },
    private readonly sender: Giver["sendTo"],
    private readonly accountsStorage: SimpleAccountsStorage,
  ) {}

  /*
   * Deploy and add the account to the account storage
   */
  public addNewAccount = async (params: CreateAccountParams<T>): Promise<CreateAccountOutput> => {
    const { account, tx } = await this.createAccount(params);
    this.accountsStorage.addAccount(account);
    return { account, tx };
  };

  private createAccount = async (params: CreateAccountParams<T>): Promise<CreateAccountOutput> => {
    switch (params.type) {
      case WalletTypes.WalletV3: {
        const account = await WalletV3Account.fromPubkey({ publicKey: params.publicKey });
        const depositTransaction = await this.sender(account.address, params.value);
        return {
          account,
          tx: depositTransaction,
        };
      }
      case WalletTypes.HighLoadWalletV2: {
        const account = await HighloadWalletV2.fromPubkey({ publicKey: params.publicKey });
        const depositTransaction = await this.sender(account.address, params.value);
        return {
          account,
          tx: depositTransaction,
        };
      }
      case WalletTypes.MsigAccount: {
        const { abi } = this.sourceFactory.getContractArtifacts(params.contract);
        validateAccountAbi(abi);
        const contractWithTx = await this.sourceFactory.deployContract(params);
        const account = new MsigAccount({
          publicKey: params.publicKey,
          address: contractWithTx.contract.address,
          type: params.mSigType,
        });
        return { tx: contractWithTx.tx, account };
      }
      case WalletTypes.EverWallet: {
        const account = await EverWalletAccount.fromPubkey({ publicKey: params.publicKey, nonce: params.nonce });
        const depositTransaction = await this.sender(account.address, params.value);
        return {
          account,
          tx: depositTransaction,
        };
      }
    }
  };
  /*
   * Add an existing account to the account storage
   */
  public addExistingAccount = async (params: AddExistingAccountParams): Promise<Account> => {
    const account = await this.getExistingAccount(params);
    this.accountsStorage.addAccount(account);
    return account;
  };

  private getExistingAccount = async (params: AddExistingAccountParams): Promise<Account> => {
    switch (params.type) {
      case WalletTypes.HighLoadWalletV2:
        return HighloadWalletV2.fromPubkey({ publicKey: params.publicKey });
      case WalletTypes.WalletV3:
        return WalletV3Account.fromPubkey({ publicKey: params.publicKey });
      case WalletTypes.MsigAccount:
        return new MsigAccount({ publicKey: params.publicKey, address: params.address, type: params.mSigType });
      case WalletTypes.EverWallet:
        return new EverWalletAccount(params.address);
    }
  };

  /*
  Access to the account storage
   */
  get storage(): SimpleAccountsStorage {
    return this.accountsStorage;
  }
}
