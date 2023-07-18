import { Address, ProviderRpcClient } from "everscale-inpage-provider";
import { AccountData, TracingTransportConnection } from "../types";

export class TracingJrpcConnection implements TracingTransportConnection {
  constructor(readonly provider: ProviderRpcClient) {}
  async getAccountData(account: Address): Promise<AccountData> {
    const fullAcc = await this.provider.getFullContractState({ address: account });
    return { id: account.toString(), codeHash: fullAcc.state?.codeHash };
  }

  async getAccountsData(accounts: Address[]): Promise<AccountData[]> {
    return Promise.all(accounts.map(account => this.getAccountData(account)));
  }
}
