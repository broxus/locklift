import fs from "fs";
import path from "path";
import commander from "commander";
import { ProviderRpcClient } from "everscale-inpage-provider";
import type { Ed25519KeyPair } from "everscale-standalone-client";
import { ConnectionProperties, NETWORK_PRESETS } from "everscale-standalone-client/nodejs";
import { Giver } from "../factory";
import Joi from "joi";
import { MessageProperties } from "everscale-standalone-client/client";
import * as nt from "nekoton-wasm";

export enum ConfigState {
  EXTERNAL,
  INTERNAL,
}

export interface LockliftConfig<T extends ConfigState = ConfigState.EXTERNAL> {
  compiler: {
    includesPath?: string;
    externalContracts?: ExternalContracts;
    compilerParams?: Array<string>;
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
export interface NetworkValue<T extends ConfigState = ConfigState.EXTERNAL> {
  giver: GiverConfig;
  keys: T extends ConfigState.EXTERNAL ? KeysConfig : Required<KeysConfig>;
  connection: ConnectionProperties;
  providerConfig?: {
    message?: MessageProperties;
    initInput?: nt.InitInput | Promise<nt.InitInput>;
  };
}

export type ExternalContracts = Record<string, Array<string>>;
export type GiverConfig = {
  address: string;
  giverFactory?: (ever: ProviderRpcClient, keyPair: Ed25519KeyPair, address: string) => Giver;
} & ({ key: string } | { phrase: string; accountId: number });

export const JoiConfig = Joi.object<LockliftConfig>({
  compiler: Joi.alternatives([
    Joi.object({
      includesPath: Joi.string().optional(),
      compilerParams: Joi.array().items(Joi.string()).optional(),
      externalContracts: Joi.object().pattern(Joi.string(), Joi.array().items(Joi.string())),
      path: Joi.string(),
    }),
    Joi.object({
      includesPath: Joi.string().optional(),
      compilerParams: Joi.array().items(Joi.string()).optional(),
      externalContracts: Joi.object().pattern(Joi.string(), Joi.array().items(Joi.string())),
      version: Joi.string(),
    }),
  ]),
  linker: Joi.alternatives([
    Joi.object({
      path: Joi.string(),
      lib: Joi.string(),
    }),
    Joi.object({
      version: Joi.string(),
    }),
  ]),
  networks: Joi.object().pattern(
    Joi.string(),

    Joi.object({
      giver: Joi.alternatives().conditional(Joi.object({ phrase: Joi.string().required() }).unknown(), {
        then: Joi.object({
          address: Joi.string(),
          giverFactory: Joi.any().optional(),
          phrase: Joi.string(),
          accountId: Joi.number(),
        }),
        otherwise: Joi.object({
          address: Joi.string(),
          giverFactory: Joi.any().optional(),
          key: Joi.string(),
        }),
      }),
      keys: Joi.object({
        path: Joi.string().optional(),
        phrase: Joi.string().optional(),
        amount: Joi.number(),
      }),
      connection: Joi.alternatives([
        ...Object.keys(NETWORK_PRESETS).map(el => el),
        Joi.object({
          id: Joi.number().optional(),
          type: Joi.alternatives(["graphql", "jrpc", "proxy"]),
          group: Joi.string().optional(),
          data: Joi.alternatives().conditional("type", {
            is: "graphql",
            then: Joi.object({
              endpoints: Joi.array().items(Joi.string()),
              local: Joi.boolean().optional(),
              latencyDetectionInterval: Joi.number().optional(),
              maxLatency: Joi.number().optional(),
            }),
            otherwise: Joi.alternatives().conditional("type", {
              is: "jrpc",
              then: Joi.object({
                endpoint: Joi.string(),
              }),
              otherwise: Joi.object({
                connectionFactory: Joi.object().custom((value, helpers) => {
                  return value;
                  // if (value instanceof ConnectionFactory) {
                  //   return value;
                  // }
                  // return helpers.message({"custom": "Invalid proxy connection"});
                }),
              }),
              // otherwise: Joi.object().custom((value, helpers) => {
              //   if (value instanceof ConnectionFactory) {
              //     return value;
              //   }
              //   return helpers.message({"custom": "Invalid proxy connection"});
              // }),
            }),
          }),
        }),
      ]),
      providerConfig: Joi.object({
        message: Joi.object({}).optional().unknown(),
        initInput: Joi.any().optional(),
      }).optional(),

      tracing: Joi.object({
        endpoint: Joi.string(),
      }).optional(),
    }).unknown(),
  ),
  mocha: Joi.object({
    tsconfig: Joi.string().optional(),
  }).unknown(true),
}).unknown();

export function loadConfig(configPath: string): LockliftConfig<ConfigState.INTERNAL> {
  const resolvedConfigPath = path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(resolvedConfigPath)) {
    throw new commander.InvalidOptionArgumentError(`Config at ${configPath} not found!`);
  }

  const configFile = require(resolvedConfigPath);

  const validationResult = JoiConfig.validate(configFile.default);
  if (validationResult.error) {
    throw new Error(validationResult.error.annotate());
  }
  const config = validationResult.value;
  for (const value of Object.values(config.networks)) {
    if (value.keys != null) {
      value.keys = {
        ...value.keys,
        phrase: value.keys?.phrase || "maze turn choose industry beauty sweet panther valve double report upset mother",
        path: value.keys.path || "m/44'/396'/0'/0/INDEX",
      };
    }
  }

  return config as unknown as LockliftConfig<ConfigState.INTERNAL>;
}
