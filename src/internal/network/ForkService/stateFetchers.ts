import { Address, ProviderRpcClient } from "everscale-inpage-provider";
import { ConnectionProperties, EverscaleStandaloneClient } from "everscale-standalone-client/nodejs";
import axios from "axios";
import { ForkCacheService } from "./index";
import { logger } from "../../logger";
import { AccountFetcherResponse } from "@broxus/locklift-network/src/types";

export interface SourceFetcher {
  getBocAndCodeHash(params: { address: Address }): Promise<AccountFetcherResponse>;
}

export class LiveFetcher implements SourceFetcher {
  constructor(private readonly provider: ProviderRpcClient) {}

  static init = async (connectionConfig: ConnectionProperties) => {
    const provider = new ProviderRpcClient({
      fallback: () =>
        EverscaleStandaloneClient.create({
          connection: connectionConfig,
        }),
    });
    await provider.ensureInitialized();
    return new LiveFetcher(provider);
  };

  private async _getBocAndCodeHash({ address }: { address: Address }): Promise<AccountFetcherResponse> {
    const { state } = await this.provider.getFullContractState({ address });
    if (!state || !state.codeHash) {
      throw new Error(`Failed to get state for ${address}`);
    }
    return { boc: state.boc, codeHash: state.codeHash, type: "accountStuffBoc" };
  }

  async getBocAndCodeHash(params: { address: Address }): Promise<AccountFetcherResponse> {
    return await this._getBocAndCodeHash(params);
  }
}

export class BlockFetcher implements SourceFetcher {
  constructor(private readonly cacheService: ForkCacheService, private readonly blockNumber: number) {}

  private async _getBocAndCodeHash({ address }: { address: Address }): Promise<AccountFetcherResponse> {
    logger.printInfo(`Getting state for ${address.toString()}, it may take a while...`);
    const { data } = await axios.post<{ accountBoc: string; codeHash: string | null }>(
      " https://states.everscan.io/apply_mc",
      {
        account: address.toString(),
        mcSeqno: this.blockNumber,
      },
    );
    if (!data || !data.codeHash) {
      throw new Error(`Failed to get state for ${address}`);
    }
    logger.printInfo(`Got state for ${address.toString()}, added to cache`);
    return { boc: data.accountBoc, codeHash: data.codeHash, type: "fullAccountBoc" };
  }

  async getBocAndCodeHash(params: { address: Address }): Promise<AccountFetcherResponse> {
    const cached = this.cacheService.getContractCache(params.address.toString());
    if (cached) {
      return cached;
    }
    const newContent = await this._getBocAndCodeHash(params);
    this.cacheService.setNewContractToCache(params.address.toString(), newContent);
    return newContent;
  }
}
