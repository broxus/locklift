"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = void 0;
const nodejs_1 = require("everscale-standalone-client/nodejs");
const everscale_inpage_provider_1 = require("everscale-inpage-provider");
const nodejs_2 = require("everscale-standalone-client/nodejs");
class Provider {
    ever;
    keystore;
    clock;
    constructor(ever, keystore, clock) {
        this.ever = ever;
        this.keystore = keystore;
        this.clock = clock;
    }
    static async setup(providerConfig) {
        const clock = new nodejs_2.Clock();
        const keystore = new nodejs_1.SimpleKeystore([...providerConfig.keys].reduce((acc, keyPair, idx) => ({
            ...acc,
            [idx]: keyPair,
        }), {}));
        keystore.addKeyPair("giver", providerConfig.giverKeys);
        const ever = new everscale_inpage_provider_1.ProviderRpcClient({
            fallback: () => nodejs_1.EverscaleStandaloneClient.create({
                ...providerConfig.connectionProperties,
                keystore,
                clock,
            }),
        });
        await ever.ensureInitialized();
        return new Provider(ever, keystore, clock);
    }
    getBalance(address) {
        return this.ever.getFullContractState({ address }).then(res => res.state?.balance);
    }
    setTimeMovement(ms) {
        this.clock.offset = ms;
    }
}
exports.Provider = Provider;
