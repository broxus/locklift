import {TracingTransport} from "./index";
import {Address} from "everscale-inpage-provider";
import {AccountData} from "../types";


export class TracingJrpcTransport extends TracingTransport {
  async getAccountData(account: Address): Promise<AccountData> {
    const full_acc = await this.provider.getFullContractState({address: account});
    return {id: account.toString(), codeHash: full_acc.state!.codeHash!};
  }

  async getAccountsData(accounts: Address[]): Promise<AccountData[]> {
    return Promise.all(accounts.map(account => this.getAccountData(account)));
  }
}
