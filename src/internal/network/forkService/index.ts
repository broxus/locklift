import { Address } from "everscale-inpage-provider";
import { AccountFetcherCallback, AccountFetcherResponse } from "@broxus/locklift-network/src/types";
import { ForkContractsConfig, ForkSource } from "../../config";
import fs from "fs-extra";

import path from "path";
import { defer, filter, from, lastValueFrom, mergeMap, toArray } from "rxjs";
import { getContractNameFromAbiPath } from "../../utils";
import { BlockFetcher, LiveFetcher, SourceFetcher } from "./stateFetchers";

export type ContractData = { contractName: string; abi: any; codeHash: string; abiPath: string };
const cacheFile = path.join(".cache/fork.json");

export class ForkCacheService {
  private currentCache: Record<string, Record<string, AccountFetcherResponse>> = {};
  constructor(private readonly forkSource: ForkSource) {
    fs.ensureFileSync(cacheFile);
    this.currentCache = fs.readJSONSync(cacheFile, { throws: false }) || {};
  }

  getContractCache(address: string): AccountFetcherResponse | undefined {
    return (this.currentCache[this.getCacheKey()] || {})[address];
  }

  private getCacheKey = () => JSON.stringify(this.forkSource);
  setNewContractToCache = (address: string, content: AccountFetcherResponse) => {
    if (!this.currentCache[this.getCacheKey()]) {
      this.currentCache[this.getCacheKey()] = {};
    }
    this.currentCache[this.getCacheKey()][address] = content;
    fs.writeJSONSync(cacheFile, this.currentCache);
  };
}
export class ForkService {
  private constructor(
    private readonly sourceFetcher: SourceFetcher,
    readonly preFetchedAccounts?: Array<ContractData>,
  ) {}

  static init = async ({
    forkSource,
    forkContractsConfig,
  }: {
    forkContractsConfig: ForkContractsConfig;
    forkSource: ForkSource;
  }): Promise<ForkService> => {
    const forkCacheService = new ForkCacheService(forkSource);

    const sourceFetcher =
      forkSource.type === "live"
        ? await LiveFetcher.init(forkSource.connection)
        : new BlockFetcher(forkCacheService, forkSource.block);

    const preFetchedAccounts =
      forkContractsConfig.length == 0
        ? undefined
        : await lastValueFrom(
            from(forkContractsConfig).pipe(
              mergeMap(({ abi, ...rest }) =>
                defer(async () => {
                  let abiJson;
                  const resolvedPath = path.resolve(abi.path);
                  try {
                    abiJson = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
                  } catch (e) {
                    console.log("Failed to read abi from path", resolvedPath, e);
                  }

                  let codeHash: string | undefined;
                  if ("address" in rest) {
                    codeHash = await sourceFetcher
                      .getBocAndCodeHash({ address: new Address(rest.address) })
                      .then(res => res.codeHash);
                  }
                  if ("codeHash" in rest) {
                    if (typeof rest.codeHash === "string") {
                      codeHash = rest.codeHash;
                    } else {
                      codeHash = await sourceFetcher
                        .getBocAndCodeHash({ address: new Address(rest.codeHash.deriveAddress) })
                        .then(({ codeHash }) => codeHash);
                    }
                  }
                  return {
                    abi: abiJson,
                    codeHash,
                    abiPath: resolvedPath,
                    contractName: getContractNameFromAbiPath(abi.path),
                  } as ContractData;
                }),
              ),
              filter(data => !!data.abi && !!data.codeHash),
              toArray(),
            ),
          );

    return new ForkService(sourceFetcher, preFetchedAccounts);
  };

  accountFetcher: AccountFetcherCallback = address => {
    return this.sourceFetcher.getBocAndCodeHash({
      address: address,
    });
  };
}
