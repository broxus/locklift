"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TracingInternal = void 0;
const everscale_inpage_provider_1 = require("everscale-inpage-provider");
const console_abi_1 = require("../console.abi");
const constances_1 = require("./constances");
const utils_1 = require("./utils");
const trace_1 = require("./trace/trace");
const lodash_1 = __importDefault(require("lodash"));
class TracingInternal {
    ever;
    factory;
    endPoint;
    enabled;
    consoleContract;
    _allowedCodes = {
        compute: [],
        action: [],
        contracts: {},
    };
    constructor(ever, factory, endPoint, enabled = false) {
        this.ever = ever;
        this.factory = factory;
        this.endPoint = endPoint;
        this.enabled = enabled;
        this.consoleContract = new ever.Contract(console_abi_1.consoleAbi, new everscale_inpage_provider_1.Address(constances_1.CONSOLE_ADDRESS));
    }
    get allowedCodes() {
        return this._allowedCodes;
    }
    setAllowCodes(allowedCodes = { compute: [], action: [] }) {
        this._allowedCodes = {
            ...this._allowedCodes,
            action: [...this._allowedCodes.action, ...allowedCodes.action],
            compute: [...this._allowedCodes.compute, ...allowedCodes.compute],
        };
    }
    allowCodesForAddress(address, allowedCodes = { compute: [], action: [] }) {
        if (!this._allowedCodes.contracts?.[address]) {
            this._allowedCodes.contracts[address] = { compute: [], action: [] };
        }
        if (allowedCodes.compute) {
            this._allowedCodes.contracts[address].compute.push(...allowedCodes.compute);
        }
        if (allowedCodes.action) {
            this._allowedCodes.contracts[address].action.push(...allowedCodes.action);
        }
    }
    removeAllowedCodesForAddress(address, allowedCodes = { compute: [], action: [] }) {
        if (!this._allowedCodes.contracts[address]) {
            this._allowedCodes.contracts[address] = { compute: [], action: [] };
        }
        if (allowedCodes.compute) {
            this._allowedCodes.contracts[address].compute.map((code) => {
                const idx = this._allowedCodes.contracts[address].compute.indexOf(code);
                if (idx > -1) {
                    this._allowedCodes.contracts[address].compute.splice(idx, 1);
                }
            });
        }
        if (allowedCodes.action) {
            this._allowedCodes.contracts[address].action.map((code) => {
                const idx = this._allowedCodes.contracts[address].action.indexOf(code);
                if (idx > -1) {
                    this._allowedCodes.contracts[address].action.splice(idx, 1);
                }
            });
        }
    }
    removeAllowedCodes(allowedCodes = { compute: [], action: [] }) {
        if (allowedCodes.compute) {
            allowedCodes.compute.map((code) => {
                const idx = this._allowedCodes.compute.indexOf(code);
                if (idx > -1) {
                    this._allowedCodes.compute.splice(idx, 1);
                }
            });
        }
        if (allowedCodes.action) {
            allowedCodes.action.map((code) => {
                const idx = this._allowedCodes.action.indexOf(code);
                if (idx > -1) {
                    this._allowedCodes.action.splice(idx, 1);
                }
            });
        }
    }
    // allowed_codes example - {compute: [100, 50, 12], action: [11, 12], "ton_addr": {compute: [60], action: [2]}}
    async trace({ inMsgId, allowedCodes = { compute: [], action: [], contracts: { any: { compute: [], action: [] } } }, }) {
        if (this.enabled) {
            const msg_tree = await this.buildMsgTree(inMsgId, this.endPoint);
            let allowedCodesExtended = lodash_1.default.merge(lodash_1.default.cloneDeep(this._allowedCodes), allowedCodes);
            const trace_tree = await this.buildTracingTree(msg_tree, allowedCodesExtended);
            const reverted = this.findRevertedBranch(trace_tree);
            if (reverted) {
                (0, utils_1.throwErrorInConsole)(reverted);
            }
            return msg_tree;
        }
    }
    async printConsoleMsg(msg) {
        const decoded = await this.consoleContract.decodeInputMessage({
            methods: ["log"],
            body: msg.body,
            internal: true,
        });
        console.log(decoded?.input);
    }
    async buildMsgTree(in_msg_id, endPoint, only_root = false) {
        const msg = await (0, utils_1.fetchMsgData)(in_msg_id, endPoint);
        if (only_root) {
            return msg;
        }
        if (msg.dst === constances_1.CONSOLE_ADDRESS) {
            await this.printConsoleMsg(msg);
        }
        msg.out_messages = [];
        if (msg.dst_transaction && msg.dst_transaction.out_msgs.length > 0) {
            msg.out_messages = await Promise.all(msg.dst_transaction.out_msgs.map(async (msg_id) => {
                return await this.buildMsgTree(msg_id, endPoint);
            }));
        }
        return msg;
    }
    async buildTracingTree(msg_tree, allowedCodes = { compute: [], action: [], contracts: { any: { compute: [], action: [] } } }) {
        const trace = new trace_1.Trace(this, msg_tree, null);
        await trace.buildTree(allowedCodes, this.factory.getContractByCodeHash);
        return trace;
    }
    // apply depth-first search on trace tree, return first found reverted branch
    findRevertedBranch(traceTree) {
        if (!traceTree.has_error_in_tree) {
            return;
        }
        return this.depthSearch(traceTree, 1, 0);
    }
    depthSearch(traceTree, totalActions, actionIdx) {
        if (traceTree.error && !traceTree.error.ignored) {
            // clean unnecessary structure
            traceTree.out_traces = [];
            return [{ totalActions, actionIdx: actionIdx, traceLog: traceTree }];
        }
        for (const [index, trace] of traceTree.out_traces.entries()) {
            const actionsNum = traceTree.out_traces.length;
            const corrupted_branch = this.depthSearch(trace, actionsNum, index);
            if (corrupted_branch) {
                // clean unnecessary structure
                traceTree.out_traces = [];
                return [{ totalActions, actionIdx, traceLog: traceTree }].concat(corrupted_branch);
            }
        }
    }
}
exports.TracingInternal = TracingInternal;
