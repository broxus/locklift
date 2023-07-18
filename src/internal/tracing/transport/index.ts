import { Address, ProviderRpcClient } from "everscale-inpage-provider";
import { AccountData, TracingTransportConnection } from "../types";
import { TracingGqlConnection } from "./gql";
import { TracingProxyConnection } from "./proxy";
import { TracingJrpcConnection } from "./jrpc";

export class TracingTransport {
  constructor(private readonly provider: ProviderRpcClient, private readonly connection: TracingTransportConnection) {}

  static fromGqlConnection(endpoint: string, provider: ProviderRpcClient): TracingTransport {
    const connection = new TracingGqlConnection(provider, endpoint);
    return new TracingTransport(provider, connection);
  }

  static fromProxyConnection(provider: ProviderRpcClient): TracingTransport {
    const connection = new TracingProxyConnection(provider);
    return new TracingTransport(provider, connection);
  }

  static fromJrpcConnection(provider: ProviderRpcClient): TracingTransport {
    const connection = new TracingJrpcConnection(provider);
    return new TracingTransport(provider, connection);
  }

  async getAccountData(address: Address): Promise<AccountData> {
    return this.connection.getAccountData(address);
  }

  async getAccountsData(accounts: Address[]): Promise<AccountData[]> {
    return this.connection.getAccountsData(accounts);
  }
}
