import { Ed25519KeyPair, EverscaleStandaloneClient, SimpleKeystore } from "everscale-standalone-client/nodejs";
import { ProviderRpcClient, Address } from "everscale-inpage-provider";
import { ClientProperties, Clock } from "everscale-standalone-client/nodejs";

type ProviderConfig = {
  giverKeys: Ed25519KeyPair;
  keys: Array<Ed25519KeyPair>;
  connectionProperties: Pick<ClientProperties, "connection">;
};

export class Provider {
  public ever: ProviderRpcClient;
  public keyStore: SimpleKeystore;
  private readonly clock = new Clock();

  constructor(providerConfig: ProviderConfig) {
    this.keyStore = new SimpleKeystore(
      [...providerConfig.keys].reduce(
        (acc, keyPair, idx) => ({
          ...acc,
          [idx]: keyPair,
        }),
        {},
      ),
    );
    this.keyStore.addKeyPair("giver", providerConfig.giverKeys);
    this.ever = new ProviderRpcClient({
      fallback: () =>
        EverscaleStandaloneClient.create({
          ...providerConfig.connectionProperties,
          keystore: this.keyStore,
          clock: this.clock,
        }),
    });
  }

  public getBalance(address: Address): Promise<string | undefined> {
    return this.ever.getFullContractState({ address }).then((res) => res.state?.balance);
  }
  public setTimeMovement(ms: number) {
    this.clock.offset = ms;
  }
}
