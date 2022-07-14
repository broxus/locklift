import { Ed25519KeyPair, SimpleKeystore } from "everscale-standalone-client/nodejs";
import { ProviderRpcClient, Address } from "everscale-inpage-provider";
import { ClientProperties } from "everscale-standalone-client/nodejs";
declare type ProviderConfig = {
    giverKeys: Ed25519KeyPair;
    keys: Array<Ed25519KeyPair>;
    connectionProperties: Pick<ClientProperties, "connection">;
};
export declare class Provider {
    ever: ProviderRpcClient;
    keyStore: SimpleKeystore;
    private readonly clock;
    constructor(providerConfig: ProviderConfig);
    getBalance(address: Address): Promise<string | undefined>;
    setTimeMovement(ms: number): void;
}
export {};
