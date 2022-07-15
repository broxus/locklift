"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = exports.ConfigState = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const commander_1 = __importDefault(require("commander"));
const ss = __importStar(require("superstruct"));
const everscale_crypto_1 = require("everscale-crypto");
var ConfigState;
(function (ConfigState) {
    ConfigState[ConfigState["EXTERNAL"] = 0] = "EXTERNAL";
    ConfigState[ConfigState["INTERNAL"] = 1] = "INTERNAL";
})(ConfigState = exports.ConfigState || (exports.ConfigState = {}));
const MochaConfig = ss.type({
    tsconfig: ss.optional(ss.string()),
});
const Config = ss.object({
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
    networks: ss.record(ss.string(), ss.object({
        // NOTE: assign(object, union) doesn't work
        giver: ss.union([
            ss.object({
                address: ss.string(),
                giverFactory: ss.func(),
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
                    group: ss.string(),
                    type: ss.pattern(ss.string(), /jrpc/),
                    data: ss.object({
                        endpoint: ss.string(),
                    }),
                }),
            ]),
        ]),
        tracing: ss.optional(ss.object({
            endpoint: ss.string(),
        })),
    })),
    mocha: MochaConfig,
});
function loadConfig(configPath) {
    const resolvedConfigPath = path_1.default.resolve(process.cwd(), configPath);
    if (!fs_1.default.existsSync(resolvedConfigPath)) {
        throw new commander_1.default.InvalidOptionArgumentError(`Config at ${configPath} not found!`);
    }
    const configFile = require(resolvedConfigPath);
    try {
        const config = ss.create(configFile.default, Config);
        for (const value of Object.values(config.networks)) {
            if (value.keys != null) {
                value.keys = {
                    ...value.keys,
                    phrase: value.keys?.phrase || (0, everscale_crypto_1.generateBip39Phrase)(12),
                    path: value.keys.path || "m/44'/396'/0'/0/INDEX",
                };
            }
        }
        return config;
    }
    catch (e) {
        if (e instanceof ss.StructError) {
            const failures = e
                .failures()
                .map(error => {
                return `\n  Path: ${error.path.join(".")}\n  Error: ${error.message}`;
            })
                .join("\n");
            console.error(`Invalid config:\n${failures}`);
            process.exit(1);
        }
        else {
            throw e;
        }
    }
}
exports.loadConfig = loadConfig;
