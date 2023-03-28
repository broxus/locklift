import { ProviderRpcClient } from "everscale-inpage-provider";
import {
  checkConnection,
  Clock,
  ConnectionError,
  ConnectionProperties,
  EverscaleStandaloneClient,
  SimpleAccountsStorage,
  SimpleKeystore,
} from "everscale-standalone-client/nodejs";
import chalk from "chalk";

import { Keys } from "./internal/keys";
import { ConfigState, LockliftConfig, NetworkValue } from "./internal/config";
import * as utils from "./utils";
import { Transactions } from "./utils";
import { logger } from "./internal/logger";
import { Factory, FactoryType, Giver } from "./internal/factory";
import { createTracing, Tracing } from "./internal/tracing";
import { createTimeMovement, TimeMovement } from "./internal/timeMovement";
import { LockliftContext } from "./internal/context/lockliftContext";
import "./chaiPlugin/types";
import { initializeExtenders } from "./plugins/utils";
import { getGiverKeyPair } from "./internal/giver/utils";
import { getGiver } from "./internal/giver";

export * from "everscale-inpage-provider";
export type { Signer } from "everscale-standalone-client";
export { Dimension, zeroAddress } from "./constants";
export type { LockliftConfig } from "./internal/config";
export type { Giver } from "./internal/factory";
export { toNano, fromNano, getRandomNonce, convertAmount } from "./utils";
export { WalletTypes } from "./types";
export { TraceType, InteractionType } from "./internal/tracing/types";
export { lockliftChai } from "./chaiPlugin";
export { NetworkValue, ConfigState } from "./internal/config";

export class Locklift<FactorySource extends FactoryType> {
  public readonly utils = utils;
  #giver?: Giver;
  #factory: Factory<FactorySource> | undefined;
  #context: LockliftContext | undefined;
  #testing: TimeMovement | undefined;
  #tracing: Tracing | undefined;

  private constructor(
    public readonly provider: ProviderRpcClient,
    public readonly keystore: SimpleKeystore,

    private readonly clock: Clock,
    public readonly transactions: Transactions,
  ) {}
  set tracing(tracing: Tracing) {
    this.#tracing = tracing;
  }
  get tracing(): Tracing {
    if (!this.#tracing) {
      throw new Error("Testing module not provided");
    }
    return this.#tracing;
  }
  set testing(testing: TimeMovement) {
    this.#testing = testing;
  }
  get testing(): TimeMovement {
    if (!this.#testing) {
      throw new Error("Testing module not provided");
    }
    return this.#testing;
  }

  set context(context: LockliftContext) {
    this.#context = context;
  }
  get context(): LockliftContext {
    if (!this.#context) {
      throw new Error("Context not provided, need to provide the network name");
    }
    return this.#context;
  }
  set factory(factory: Factory<FactorySource>) {
    this.#factory = factory;
  }
  get factory(): Factory<FactorySource> {
    if (!this.#factory) {
      throw new Error("Factory didn't provided");
    }
    return this.#factory;
  }
  set giver(giver: Giver) {
    this.#giver = giver;
  }
  get giver(): Giver {
    if (!this.#giver) {
      throw new Error("Giver not initialized, need to provide the network name");
    }
    return this.#giver;
  }

  public static async setup<T extends FactoryType>(
    config: LockliftConfig<ConfigState.INTERNAL>,
    network?: keyof LockliftConfig["networks"],
  ): Promise<Locklift<T>> {
    const networkConfig = config.networks[network as string] as NetworkValue<ConfigState.INTERNAL> | undefined;

    let keystore = new SimpleKeystore();
    if (networkConfig) {
      const giverKeys = getGiverKeyPair(networkConfig.giver);
      const keys = await Keys.generate(networkConfig.keys);

      keystore = new SimpleKeystore(
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
    }

    const accountsStorage = new SimpleAccountsStorage();
    const clock = new Clock();
    const provider = new ProviderRpcClient({
      fallback: () =>
        EverscaleStandaloneClient.create({
          connection: networkConfig?.connection,
          keystore,
          clock,
          accountsStorage,
        }),
    });
    await provider.ensureInitialized();
    const transactions = new Transactions(provider);

    const locklift = new Locklift<T>(provider, keystore, clock, transactions);

    const giver = networkConfig && (await getGiver(networkConfig.giver, provider, accountsStorage));
    if (giver) {
      locklift.giver = giver;
    }
    const factory = await Factory.setup<T>(provider, () => locklift.giver, accountsStorage);
    locklift.factory = factory;

    locklift.tracing = createTracing({
      ever: provider,
      features: transactions,
      factory,
      endpoint: networkConfig?.tracing?.endpoint,
    });

    if (networkConfig && network) {
      const timeMovement = await createTimeMovement(clock, networkConfig);
      const context = new LockliftContext({ config: networkConfig, name: network });
      locklift.testing = timeMovement;
      locklift.context = context;
    }

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
