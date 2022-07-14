"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = void 0;
const nodejs_1 = require("everscale-standalone-client/nodejs");
const everscale_inpage_provider_1 = require("everscale-inpage-provider");
const nodejs_2 = require("everscale-standalone-client/nodejs");
class Provider {
    ever;
    keyStore;
    clock = new nodejs_2.Clock();
    constructor(providerConfig) {
        this.keyStore = new nodejs_1.SimpleKeystore([...providerConfig.keys].reduce((acc, keyPair, idx) => ({
            ...acc,
            [idx]: keyPair,
        }), {}));
        this.keyStore.addKeyPair("giver", providerConfig.giverKeys);
        this.ever = new everscale_inpage_provider_1.ProviderRpcClient({
            fallback: () => nodejs_1.EverscaleStandaloneClient.create({
                ...providerConfig.connectionProperties,
                keystore: this.keyStore,
                clock: this.clock,
            }),
        });
    }
    getBalance(address) {
        return this.ever.getFullContractState({ address }).then((res) => res.state?.balance);
    }
    setTimeMovement(ms) {
        this.clock.offset = ms;
    }
}
exports.Provider = Provider;
