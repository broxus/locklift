"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTracing = exports.Tracing = void 0;
const tracingInternal_1 = require("./tracingInternal");
const utils_1 = require("../utils");
class Tracing {
    ever;
    tracingInternal;
    features;
    constructor(ever, tracingInternal, features) {
        this.ever = ever;
        this.tracingInternal = tracingInternal;
        this.features = features;
    }
    trace = async (transactionProm, config) => {
        return this.features
            .waitFinalized(transactionProm)
            .then(transaction => this.tracingInternal
            .trace({ inMsgId: (0, utils_1.extractTransactionFromParams)(transaction).inMessage.hash, ...config })
            .then(() => transaction));
    };
    get allowedCodes() {
        return this.tracingInternal.allowedCodes;
    }
    setAllowCodes = (params) => this.tracingInternal.setAllowCodes(...params);
    allowCodesForAddress = (params) => this.tracingInternal.allowCodesForAddress(...params);
    removeAllowedCodesForAddress = (params) => this.tracingInternal.removeAllowedCodesForAddress(...params);
    removeAllowedCodes = (params) => this.tracingInternal.removeAllowedCodes(...params);
}
exports.Tracing = Tracing;
const createTracing = ({ ever, factory, features, endpoint, }) => {
    const internalTracing = new tracingInternal_1.TracingInternal(ever, factory, endpoint || "", !!endpoint);
    return new Tracing(ever, internalTracing, features);
};
exports.createTracing = createTracing;
