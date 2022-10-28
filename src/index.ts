import { ProviderRpcClient } from "everscale-inpage-provider";
import {
  Clock,
  EverscaleStandaloneClient,
  SimpleKeystore,
  checkConnection,
  ConnectionError,
  ConnectionProperties,
  SimpleAccountsStorage,
} from "everscale-standalone-client/nodejs";
import chalk from "chalk";

import { Keys } from "./internal/keys";
import { ConfigState, LockliftConfig } from "./internal/config";
import * as utils from "./utils";
import { logger } from "./internal/logger";
import { FactoryType, Giver } from "./internal/factory";
import { Factory } from "./internal/factory";
import { Transactions } from "./utils";
import { createTracing, Tracing } from "./internal/tracing";
import { getGiverKeyPair } from "./internal/utilsInternal";
import { createTimeMovement, TimeMovement } from "./internal/timeMovement";
import { LockliftContext } from "./internal/context/lockliftContext";

export * from "everscale-inpage-provider";
export type { Signer } from "everscale-standalone-client";
export { Dimension, zeroAddress } from "./constants";
export type { LockliftConfig } from "./internal/config";
export type { Giver } from "./internal/factory";
export { toNano, fromNano, getRandomNonce, convertAmount } from "./utils";
export { WalletTypes } from "./types";
export { TraceType, InteractionType } from "./internal/tracing/types";
export { lockliftChai } from "./chaiPlugin";
import "./chaiPlugin/types";
import { initializeExtenders } from "./plugins/utils";
export class Locklift<FactorySource extends FactoryType> {
  public readonly utils = utils;

  private constructor(
    public readonly factory: Factory<FactorySource>,
    public readonly giver: Giver,
    public readonly provider: ProviderRpcClient,
    public readonly clock: Clock,
    public readonly keystore: SimpleKeystore,
    public readonly transactions: Transactions,
    public readonly tracing: Tracing,
    public readonly testing: TimeMovement,
    public readonly context: LockliftContext,
  ) {}

  public static async setup<T extends FactoryType>(
    config: LockliftConfig<ConfigState.INTERNAL>,
    network: keyof LockliftConfig["networks"] = "local",
  ): Promise<Locklift<T>> {
    const networkConfig = config.networks[network];

    const giverKeys = getGiverKeyPair(networkConfig.giver);
    const keys = await Keys.generate(networkConfig.keys);

    const keystore = new SimpleKeystore(
      [...keys].reduce(
        (acc, keyPair, idx) => ({
          ...acc,
          [idx]: keyPair,
        }),
        {},
      ),
    );

    keystore.addKeyPair("giver", giverKeys);

    await ensureConnectionValid(networkConfig.connection);
    const accountsStorage = new SimpleAccountsStorage();
    const clock = new Clock();
    const provider = new ProviderRpcClient({
      fallback: () =>
        EverscaleStandaloneClient.create({
          connection: networkConfig.connection,
          keystore,
          clock,
          accountsStorage,
        }),
    });
    await provider.ensureInitialized();

    const giver = networkConfig.giver.giverFactory(provider, giverKeys, networkConfig.giver.address);

    const factory = await Factory.setup<T>(provider, giver, accountsStorage);

    const transactions = new Transactions(provider);

    const tracing = createTracing({
      ever: provider,
      features: transactions,
      factory,
      endpoint: networkConfig.tracing?.endpoint,
    });
    const timeMovement = await createTimeMovement(clock, networkConfig);
    const context = new LockliftContext({ config: networkConfig, name: network });
    const locklift = new Locklift<T>(
      factory,
      giver,
      provider,
      clock,
      keystore,
      transactions,
      tracing,
      timeMovement,
      context,
    );
    await initializeExtenders({ locklift, config, network });
    return locklift;
  }
}

async function ensureConnectionValid(connection: ConnectionProperties): Promise<void> {
  try {
    await checkConnection(connection);
  } catch (e: any) {
    const localNodeInfo = `
Make sure local node is running. To start it use:
  ${chalk.bold("everdev se start")}
or
  ${chalk.bold("docker run -d --name local-node -e USER_AGREEMENT=yes -p80:80 tonlabs/local-node")}`;

    if (e instanceof ConnectionError) {
      const endpoints = e.params.type == "graphql" ? e.params.data.endpoints : [e.params.data.endpoint];
      const additional = e.params.type == "graphql" && e.params.data.local ? localNodeInfo : "";
      logger.printError(
        `Failed to create ${e.params.type} connection. Please check your endpoints: ${endpoints.join(
          " ",
        )}${additional}`,
      );
      process.exit(1);
    } else {
      throw e;
    }
  }
}
