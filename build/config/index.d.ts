/// <reference types="mocha" />
import { ProviderRpcClient } from "everscale-inpage-provider";
import type { Ed25519KeyPair } from "everscale-standalone-client";
import { ConnectionProperties } from "everscale-standalone-client";
import { Giver } from "../factory";
export declare enum ConfigState {
    EXTERNAL = 0,
    INTERNAL = 1
}
export interface LockliftConfig<T extends ConfigState = ConfigState.EXTERNAL> {
    compiler: {
        includesPath?: string;
        externalContracts?: ExternalCotracts;
    } & ({
        path: string;
    } | {
        version: string;
    });
    linker: {
        path: string;
        lib: string;
    } | {
        version: string;
    };
    networks: Networks<T>;
    mocha: Mocha.MochaOptions & {
        tsconfig?: string;
    };
}
export declare type KeysConfig = {
    path?: string;
    phrase?: string;
    amount: number;
};
export declare type Networks<T extends ConfigState = ConfigState.EXTERNAL> = Record<"local" | string, NetworkValue<T>>;
export declare type NetworkValue<T extends ConfigState = ConfigState.EXTERNAL> = {
    giver: GiverConfig;
    keys: T extends ConfigState.EXTERNAL ? KeysConfig : Required<KeysConfig>;
    connection: ConnectionProperties;
    tracing?: {
        endpoint: string;
    };
};
export declare type ExternalCotracts = Record<string, Array<string>>;
export declare type GiverConfig = {
    address: string;
    giverFactory: (ever: ProviderRpcClient, keyPair: Ed25519KeyPair, address: string) => Giver;
} & ({
    key: string;
} | {
    phrase: string;
    accountId: number;
});
export declare function loadConfig(configPath: string): LockliftConfig<ConfigState.INTERNAL>;
