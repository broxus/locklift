"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = exports.ConfigState = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const commander_1 = __importDefault(require("commander"));
const everscale_crypto_1 = require("everscale-crypto");
const superstruct_1 = require("superstruct");
const lodash_1 = __importDefault(require("lodash"));
var ConfigState;
(function (ConfigState) {
    ConfigState[ConfigState["EXTERNAL"] = 0] = "EXTERNAL";
    ConfigState[ConfigState["INTERNAL"] = 1] = "INTERNAL";
})(ConfigState = exports.ConfigState || (exports.ConfigState = {}));
const MochaConfig = (0, superstruct_1.object)();
const Config = (0, superstruct_1.object)({
    compiler: (0, superstruct_1.any)(),
    linker: (0, superstruct_1.any)(),
    networks: (0, superstruct_1.any)(),
    mocha: MochaConfig,
});
function loadConfig(configPath) {
    const resolvedConfigPath = path_1.default.resolve(process.cwd(), configPath);
    if (!fs_1.default.existsSync(resolvedConfigPath)) {
        throw new commander_1.default.InvalidOptionArgumentError(`Config at ${configPath} not found!`);
    }
    const configFile = require(resolvedConfigPath);
    const config = (0, superstruct_1.create)(configFile.default, Config);
    const networks = (0, lodash_1.default)(config.networks)
        .toPairs()
        .map(([key, value]) => {
        const resultValue = {
            giver: value.giver,
            keys: {
                ...value.keys,
                phrase: value.keys?.phrase || (0, everscale_crypto_1.generateBip39Phrase)(12),
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
exports.loadConfig = loadConfig;
