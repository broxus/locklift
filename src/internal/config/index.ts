import fs from "fs";
import path from "path";
import commander from "commander";
import * as ss from "superstruct";
import { ProviderRpcClient } from "everscale-inpage-provider";
import type { Ed25519KeyPair } from "everscale-standalone-client";
import { ConnectionProperties } from "everscale-standalone-client";
import { generateBip39Phrase } from "everscale-crypto";
import { Giver } from "../factory";

export enum ConfigState {
  EXTERNAL,
  INTERNAL,
}

export interface LockliftConfig<T extends ConfigState = ConfigState.EXTERNAL> {
  compiler: {
    includesPath?: string;
    externalContracts?: ExternalCotracts;
  } & ({ path: string } | { version: string });

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
  keys: T extends ConfigState.EXTERNAL ? KeysConfig : Required<KeysConfig>;
  connection: ConnectionProperties;
  tracing?: {
    endpoint: string;
  };
};

export type ExternalCotracts = Record<string, Array<string>>;
export type GiverConfig = {
  address: string;
  giverFactory: (ever: ProviderRpcClient, keyPair: Ed25519KeyPair, address: string) => Giver;
} & ({ key: string } | { phrase: string; accountId: number });

const MochaConfig = ss.type({
  tsconfig: ss.optional(ss.string()),
});
const Config = ss.union([
  ss.object({
    // NOTE: assign(object, union) doesn't work
    compiler: ss.union([
      ss.object({
        includesPath: ss.optional(ss.string()),
        externalContracts: ss.optional(ss.record(ss.string(), ss.array(ss.string()))),
        path: ss.string(),
      }),
      ss.object({
        includesPath: ss.optional(ss.string()),
        externalContracts: ss.optional(ss.record(ss.string(), ss.array(ss.string()))),
        version: ss.string(),
      }),
    ]),
    linker: ss.union([
      ss.object({
        path: ss.string(),
        lib: ss.string(),
      }),
      ss.object({
        version: ss.string(),
      }),
    ]),
    networks: ss.record(
      ss.string(),
      ss.object({
        // NOTE: assign(object, union) doesn't work
        giver: ss.union([
          ss.object({
            address: ss.string(),
            giverFactory: ss.func() as unknown as ss.Struct<GiverConfig["giverFactory"], null>,
            key: ss.string(),
          }),
          ss.object({
            address: ss.string(),
            giverFactory: ss.func(),
            phrase: ss.string(),
            accountId: ss.number(),
          }),
        ]),
        keys: ss.object({
          path: ss.optional(ss.string()),
          phrase: ss.optional(ss.string()),
          amount: ss.number(),
        }),
        connection: ss.union([
          ss.string(),
          // NOTE: assign(object, union) doesn't work
          ss.union([
            ss.object({
              id: ss.optional(ss.number()),
              group: ss.string(),
              type: ss.pattern(ss.string(), /graphql/),
              data: ss.object({
                endpoints: ss.array(ss.string()),
                local: ss.boolean(),
                latencyDetectionInterval: ss.optional(ss.number()),
                maxLatency: ss.optional(ss.number()),
              }),
            }),
            ss.object({
              id: ss.optional(ss.number()),
              group: ss.string(),
              type: ss.pattern(ss.string(), /jrpc/),
              data: ss.object({
                endpoint: ss.string(),
              }),
            }),
          ]),
        ]),
        tracing: ss.optional(
          ss.object({
            endpoint: ss.string(),
          }),
        ),
      }),
    ),
    mocha: MochaConfig,
  }),
  ss.object(),
]);

export function loadConfig(configPath: string): LockliftConfig<ConfigState.INTERNAL> {
  const resolvedConfigPath = path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(resolvedConfigPath)) {
    throw new commander.InvalidOptionArgumentError(`Config at ${configPath} not found!`);
  }

  const configFile = require(resolvedConfigPath);
  try {
    const config: LockliftConfig = ss.create(configFile.default, Config) as LockliftConfig;

    for (const value of Object.values(config.networks)) {
      if (value.keys != null) {
        value.keys = {
          ...value.keys,
          phrase: value.keys?.phrase || generateBip39Phrase(12),
          path: value.keys.path || "m/44'/396'/0'/0/INDEX",
        };
      }
    }

    return config as unknown as LockliftConfig<ConfigState.INTERNAL>;
  } catch (e: any) {
    if (e instanceof ss.StructError) {
      const failures = e
        .failures()
        .map(error => {
          return `\n  Path: ${error.path.join(".")}\n  Error: ${error.message}`;
        })
        .join("\n");
      console.error(`Invalid config:\n${failures}`);
      process.exit(1);
    } else {
      throw e;
    }
  }
}
