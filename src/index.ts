import { ProviderRpcClient } from "everscale-inpage-provider";
import {
  Clock,
  EverscaleStandaloneClient,
  SimpleKeystore,
  checkConnection,
  ConnectionError,
  ConnectionProperties,
} from "everscale-standalone-client/nodejs";
import chalk from "chalk";

import { Keys } from "./keys";
import { ConfigState, LockliftConfig } from "./config";
import * as utils from "./utils";
import { logger } from "./logger";
import { Giver } from "./factory";
import { Factory } from "./factory";
import { Transactions } from "./utils";
import { createTracing, Tracing } from "./tracing";
import { getGiverKeyPair } from "./utilsInternal";
import { createTimeMovement, TimeMovement } from "./timeMovement";
import { LockliftContext } from "./context/lockliftContext";

export * from "everscale-inpage-provider";
export type { Signer } from "everscale-standalone-client";
export { Dimension, zeroAddress } from "./constants";
export type { LockliftConfig } from "./config";
export type { Giver } from "./factory";

export class Locklift<FactorySource = any> {
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

  public static async setup<T>(
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

    const clock = new Clock();
    const provider = new ProviderRpcClient({
      fallback: () =>
        EverscaleStandaloneClient.create({
          connection: networkConfig.connection,
          keystore,
          clock,
        }),
    });
    await provider.ensureInitialized();

    const giver = networkConfig.giver.giverFactory(provider, giverKeys, networkConfig.giver.address);

    const factory = await Factory.setup<T>(provider, giver);

    const transactions = new Transactions(provider);

    const tracing = createTracing({
      ever: provider,
      features: transactions,
      factory,
      endpoint: networkConfig.tracing?.endpoint,
    });
    const timeMovement = await createTimeMovement(clock, networkConfig);
    const context = new LockliftContext({ config: networkConfig, name: network });
    return new Locklift<T>(factory, giver, provider, clock, keystore, transactions, tracing, timeMovement, context);
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
