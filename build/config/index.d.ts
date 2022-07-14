/// <reference types="mocha" />
import { Ed25519KeyPair } from "everscale-standalone-client/nodejs";
import { ProviderRpcClient } from "everscale-inpage-provider";
import { GiverI } from "../factory";
import { ConnectionProperties } from "everscale-standalone-client";
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
    keys: T extends ConfigState.EXTERNAL ? KeysConfig : KeysConfigRequired;
    connection: ConnectionProperties;
    tracing?: {
        endPoint: string;
    };
};
export declare type KeysConfigRequired = Omit<KeysConfig, "phrase"> & {
    phrase: string;
};
export declare type ExternalCotracts = Record<string, Array<string>>;
export declare type GiverConfig = {
    address: string;
    giverFactory: (ever: ProviderRpcClient, keyPair: Ed25519KeyPair, address: string) => GiverI;
} & ({
    key: string;
} | {
    phrase: string;
    accountId: number;
});
export declare function loadConfig(configPath: string): LockliftConfig<ConfigState.INTERNAL>;
