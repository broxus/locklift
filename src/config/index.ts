import { Ed25519KeyPair } from "everscale-standalone-client/nodejs";
import { ProviderRpcClient } from "everscale-inpage-provider";
import { GiverI } from "../factory";
import fs from "fs";
import path from "path";
import commander from "commander";
import { generateBip39Phrase } from "everscale-crypto";
import { object, string, defaulted, create, any, integer, record, number } from "superstruct";
import _ from "lodash";

import { ConnectionProperties } from "everscale-standalone-client";
export enum ConfigState {
  EXTERNAL,
  INTERNAL,
}
export interface LockliftConfig<T extends ConfigState = ConfigState.EXTERNAL> {
  compiler: {
    includesPath?: string;
    externalContracts?: ExternalCotracts;
  } & (
    | {
        path: string;
      }
    | { version: string }
  );
  linker:
    | {
        path: string;
        lib: string;
      }
    | { version: string };
  networks: Networks<T>;
  mocha: Mocha.MochaOptions & {
    tsconfig?: string;
  };
}
export type KeysConfig = {
  path?: string;
  phrase?: string;
  amount: number;
};
export type Networks<T extends ConfigState = ConfigState.EXTERNAL> = Record<"local" | string, NetworkValue<T>>;
export type NetworkValue<T extends ConfigState = ConfigState.EXTERNAL> = {
  giver: GiverConfig;
  keys: T extends ConfigState.EXTERNAL ? KeysConfig : KeysConfigRequired;
  connection: ConnectionProperties;
  tracing?: {
    endPoint: string;
  };
};
export type KeysConfigRequired = Omit<KeysConfig, "phrase"> & { phrase: string };

export type ExternalCotracts = Record<string, Array<string>>;
export type GiverConfig = {
  address: string;
  giverFactory: (ever: ProviderRpcClient, keyPair: Ed25519KeyPair, address: string) => GiverI;
} & ({ key: string } | { phrase: string; accountId: number });

const Giver = object({
  address: string(),
  key: string(),
  giverFactory: any(),
});

const Keys = object({
  phrase: string(),
  amount: defaulted(integer(), () => 25),
  path: defaulted(string(), () => "m/44'/396'/0'/0/INDEX"),
});

const MochaConfig = object();

const Config = object({
  compiler: any(),
  linker: any(),
  networks: any(),
  mocha: MochaConfig,
});

export function loadConfig(configPath: string): LockliftConfig<ConfigState.INTERNAL> {
  const resolvedConfigPath = path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(resolvedConfigPath)) {
    throw new commander.InvalidOptionArgumentError(`Config at ${configPath} not found!`);
  }

  const configFile = require(resolvedConfigPath);
  const config: LockliftConfig = create(configFile.default, Config) as LockliftConfig;
  const networks: Networks<ConfigState.INTERNAL> = _(config.networks)
    .toPairs()
    .map(([key, value]) => {
      const resultValue: NetworkValue<ConfigState.INTERNAL> = {
        giver: value.giver as GiverConfig,
        keys: {
          ...value.keys,
          phrase: value.keys?.phrase || generateBip39Phrase(12),
          path: value.keys.path || "m/44'/396'/0'/0/INDEX",
        },
        connection: value.connection,
        tracing: value.tracing,
      };
      return [key, resultValue];
    })
    .fromPairs()
    .value();

  return { ...config, networks };
}
