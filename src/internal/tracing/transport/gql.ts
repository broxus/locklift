import { Address, ProviderRpcClient } from "everscale-inpage-provider";
import { httpService } from "../../httpService";
import { AccountData, TracingTransportConnection } from "../types";
import _ from "lodash";

export class TracingGqlConnection implements TracingTransportConnection {
  constructor(readonly provider: ProviderRpcClient, readonly gqlEndpoint: string) {}

  async getAccountData(account: Address): Promise<AccountData> {
    return (await this.getAccountsData([account]))[0];
  }

  private async _getAccountsData(accounts: Address[]): Promise<AccountData[]> {
    const msgQuery = `{
      accounts(
        filter: {
          id: {
            in: ${JSON.stringify(accounts.map(account => account.toString()))}
          }
        }
      ) {
        code_hash
        id
      }
    }`;
    const response = await httpService
      .post<{ data: { accounts: Array<{ id: string; code_hash: string }> } }>(this.gqlEndpoint, { query: msgQuery })
      .then(res => res.data.data);
    // eslint-disable-next-line camelcase
    return response.accounts.map(({ id, code_hash }) => ({ id, codeHash: code_hash }));
  }

  async getAccountsData(accounts: Address[]): Promise<AccountData[]> {
    const chunked = _.chunk(accounts, 100);
    const result = await Promise.all(chunked.map(chunk => this._getAccountsData(chunk)));
    return _.flatten(result);
  }
}
