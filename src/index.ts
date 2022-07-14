import { Keys } from "./keys";
import { ConfigState, LockliftConfig, NetworkValue } from "./config";
import * as utils from "./utils";
import { GiverI } from "./factory";
export { GiverI } from "./factory/giver";
import { Provider } from "./provider";
import { Factory } from "./factory";
import { Transactions } from "./utils";
import { createTracing, Tracing } from "./tracing";
import { getGiverKeyPair } from "./utilsInternal";
export * from "everscale-inpage-provider";
export { Dimensions, zeroAddress } from "./constants";

export class Locklift<FactorySource = any> {
  networkConfig!: NetworkValue<ConfigState.INTERNAL>;
  factory!: Factory<FactorySource>;
  giver!: GiverI;
  utils = utils;
  transactions!: Transactions;
  provider!: Provider;
  tracing!: Tracing;
  constructor(
    private readonly config: LockliftConfig<ConfigState.INTERNAL>,
    private readonly network: keyof LockliftConfig["networks"] = "local",
  ) {
    this.networkConfig = this.config.networks[this.network];
  }

  async setup() {
    try {
      const keys = new Keys(this.networkConfig.keys);
      const keyPairs = await keys.setup().then(() => keys.getKeyPairs());
      const giverKeys = getGiverKeyPair(this.networkConfig.giver);

      this.provider = new Provider({
        giverKeys,
        keys: keyPairs,
        connectionProperties: {
          connection: this.networkConfig.connection,
        },
      });

      await this.provider.ever.ensureInitialized();
      this.giver = this.config.networks[this.network].giver.giverFactory(
        this.provider.ever,
        giverKeys,
        this.networkConfig.giver.address,
      );
      this.factory = new Factory(this.provider.ever, this.giver);
      await this.factory.setup();

      this.transactions = new Transactions(this.provider.ever, this.tracing);
      this.tracing = createTracing({
        ever: this.provider.ever,
        features: this.transactions,
        factory: this.factory,
        endPoint: this.config.networks[this.network].tracing?.endPoint,
      });
    } catch (e) {
      console.error(e);
    }
  }
}
