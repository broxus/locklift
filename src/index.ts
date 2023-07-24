import { ProviderRpcClient } from "everscale-inpage-provider";
import {
  Clock,
  EverscaleStandaloneClient,
  SimpleAccountsStorage,
  SimpleKeystore,
} from "everscale-standalone-client/nodejs";
import chalk from "chalk";

import { Keys } from "./internal/keys";
import { ConfigState, LockliftConfig, NetworkValue } from "./internal/config";
import * as utils from "./utils";
import { Transactions } from "./utils";
import { Factory, FactoryType, Giver } from "./internal/factory";
import { createTracing, Tracing } from "./internal/tracing";
import { createTimeMovement, TimeMovement } from "./internal/timeMovement";
import { LockliftContext } from "./internal/context/lockliftContext";
import "./chaiPlugin/types";
import { initializeExtenders } from "./plugins/utils";
import { getGiverKeyPair } from "./internal/giver/utils";
import { getGiver } from "./internal/giver";
import { logger } from "./internal/logger";
import { TracingTransport } from "./internal/tracing/transport";
import { LockliftNetwork } from "@broxus/locklift-network";

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
  #network: LockliftNetwork | undefined;

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

  set network(network: LockliftNetwork) {
    this.#network = network;
  }

  get network(): LockliftNetwork {
    if (!this.#network) {
      throw new Error("Network didn't provided");
    }
    return this.#network;
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
    const networkConfig = config.networks[network as string] as NetworkValue<ConfigState.INTERNAL>;

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
    }

    const proxyNetwork = new LockliftNetwork();
    await proxyNetwork.initialize();
    // TODO: fix ts-ignore
    if (
      // @ts-ignore
      networkConfig?.connection?.type === "proxy" &&
      // @ts-ignore
      networkConfig?.connection?.data?.connectionFactory === undefined
    ) {
      // @ts-ignore
      networkConfig.connection.data.connectionFactory = proxyNetwork.connectionFactory;
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
        }).then(client => {
          client.setPollingInterval(5);
          return client;
        }),
    });
    try {
      await provider.ensureInitialized();
    } catch (e: any) {
      logger.printError(`${chalk.bold(`${e.message}\nMake sure local node is running. or...`)}`);
      process.exit(1);
    }
    const transactions = new Transactions(provider);

    const locklift = new Locklift<T>(provider, keystore, clock, transactions);

    const giver = networkConfig && (await getGiver(networkConfig.giver, provider, accountsStorage));
    if (giver) {
      locklift.giver = giver;
    }
    const factory = await Factory.setup<T>(provider, () => locklift.giver, accountsStorage);
    locklift.factory = factory;

    const tracingTransport = (() => {
      // @ts-ignore
      switch (networkConfig?.connection.type) {
        case "graphql":
          // @ts-ignore
          return TracingTransport.fromGqlConnection(networkConfig.connection.data.endpoints[0], provider);
        case "jrpc":
          return TracingTransport.fromJrpcConnection(provider);
        case "proxy":
          return TracingTransport.fromProxyConnection(provider);
      }
    })() as TracingTransport;

    locklift.network = proxyNetwork;
    locklift.tracing = createTracing({
      ever: provider,
      features: transactions,
      network: proxyNetwork,
      factory,
      tracingTransport,
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
