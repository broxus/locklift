import {Address, ProviderRpcClient} from "everscale-inpage-provider";
import {AccountData} from "../types";
import {TracingGqlTransport} from "./gql";
import {TracingProxyTransport} from "./proxy";
import {TracingJrpcTransport} from "./jrpc";


export class TracingTransport {
  constructor(
    readonly provider: ProviderRpcClient
  ) {}

  static fromGqlConnection(endpoint: string, provider: ProviderRpcClient): TracingTransport {
    return new TracingGqlTransport(provider, endpoint);
  }

  static fromProxyConnection(provider: ProviderRpcClient): TracingTransport {
    return new TracingProxyTransport(provider)
  }

  static fromJrpcConnection(provider: ProviderRpcClient): TracingTransport {
    return new TracingJrpcTransport(provider);
  }

  async getAccountData(address: Address): Promise<AccountData> {
    throw new Error("Method not implemented.");
  }

  async getAccountsData(accounts: Address[]): Promise<AccountData[]> {
    throw new Error("Method not implemented.");
  }
}
