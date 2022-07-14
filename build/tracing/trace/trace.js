"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trace = void 0;
const constances_1 = require("../constances");
const types_1 = require("../types");
const everscale_inpage_provider_1 = require("everscale-inpage-provider");
const utils_1 = require("./utils");
class Trace {
    tracing;
    msg;
    src_trace;
    out_traces = [];
    error = null;
    type = null;
    contract;
    decodedMsg = null;
    has_error_in_tree = false;
    constructor(tracing, msg, src_trace = null) {
        this.tracing = tracing;
        this.msg = msg;
        this.src_trace = src_trace;
    }
    async buildTree(allowedCodes = { compute: [], action: [], contracts: { any: { compute: [], action: [] } } }, contractGetter) {
        this.setMsgType();
        const { codeHash, address } = (0, utils_1.contractContractInformation)({ msg: this.msg, type: this.type });
        const contract = contractGetter(codeHash || "", new everscale_inpage_provider_1.Address(address));
        this.checkForErrors(allowedCodes);
        await this.decode(contract);
        for (const msg of this.msg.out_messages) {
            const trace = new Trace(this.tracing, msg, this);
            await trace.buildTree(allowedCodes, contractGetter);
            if (trace.has_error_in_tree) {
                this.has_error_in_tree = true;
            }
            this.out_traces.push(trace);
        }
    }
    // allowed_codes - {compute: [100, 50, 12], action: [11, 12]}
    checkForErrors(allowedCodes = { compute: [], action: [], contracts: { any: { compute: [], action: [] } } }) {
        const tx = this.msg.dst_transaction;
        if (this.msg.dst === constances_1.CONSOLE_ADDRESS) {
            return;
        }
        let skip_compute_check = false;
        if (tx && (tx.compute.success || tx.compute.compute_type === 0) && !tx.aborted) {
            skip_compute_check = true;
        }
        let skip_action_check = false;
        if (tx && tx.action && tx.action.success) {
            skip_action_check = true;
        }
        // error occured during compute phase
        if (!skip_compute_check && tx && tx.compute.exit_code !== 0) {
            this.error = { phase: "compute", code: tx.compute.exit_code };
            // we didnt expect this error, save error
            if (allowedCodes.compute.indexOf(tx.compute.exit_code) > -1 ||
                (allowedCodes.contracts[this.msg.dst] &&
                    allowedCodes.contracts[this.msg.dst].compute.indexOf(tx.compute.exit_code) > -1)) {
                this.error.ignored = true;
            }
        }
        else if (!skip_action_check && tx && tx.action && tx.action.result_code !== 0) {
            this.error = { phase: "action", code: tx.action.result_code };
            // we didnt expect this error, save error
            if (allowedCodes.action.indexOf(tx.action.result_code) > -1 ||
                (allowedCodes.contracts[this.msg.dst] &&
                    allowedCodes.contracts[this.msg.dst].action.indexOf(tx.action.result_code) > -1)) {
                this.error.ignored = true;
            }
        }
        if (this.error && !this.error.ignored) {
            this.has_error_in_tree = true;
        }
    }
    async decodeMsg(contract = null) {
        if (contract === null) {
            contract = this.contract;
        }
        if (this.msg.dst === constances_1.CONSOLE_ADDRESS) {
            return;
        }
        if (this.type === types_1.TraceType.TRANSFER || this.type === types_1.TraceType.BOUNCE) {
            return;
        }
        if (this.type === types_1.TraceType.FUNCTION_CALL && this.src_trace) {
            // this is responsible callback with answerId = 0, we cant decode it, however contract doesnt need it too
            if (this.src_trace.decoded_msg && this.src_trace.decoded_msg.value?.answerId === "0") {
                return;
            }
        }
        // function call, but we dont have contract here => we cant decode msg
        if (this.type === types_1.TraceType.FUNCTION_CALL && !contract) {
            return;
        }
        // 60 error on compute phase - wrong function id. We cant decode this msg with contract abi
        if (this.error && this.error.phase === "compute" && this.error.code === 60) {
            return;
        }
        if (!contract) {
            return;
        }
        const is_internal = this.msg.msg_type === 0;
        const parsedAbi = JSON.parse(contract.contract.abi);
        const decodedMsg = (await contract.contract.decodeInputMessage({
            internal: is_internal,
            body: this.msg.body,
            methods: parsedAbi.functions.map((el) => el.name),
        }));
        // determine more precisely is it an event or function return
        if (this.type === types_1.TraceType.EVENT_OR_FUNCTION_RETURN) {
            // @ts-ignore
            const is_function_return = parsedAbi.functions.find(({ name }) => name === decodedMsg.method);
            if (is_function_return) {
                this.type = types_1.TraceType.FUNCTION_RETURN;
            }
            else {
                this.type = types_1.TraceType.EVENT;
            }
        }
        this.decodedMsg = decodedMsg;
    }
    async decode(contract) {
        this.contract = contract;
        await this.decodeMsg(contract);
    }
    setMsgType() {
        switch (this.msg.msg_type) {
            // internal - deploy or function call or bound or transfer
            case 0:
                // code hash is presented, deploy
                if (this.msg.code_hash !== null) {
                    this.type = types_1.TraceType.DEPLOY;
                    // bounced msg
                }
                else if (this.msg.bounced) {
                    this.type = types_1.TraceType.BOUNCE;
                    // empty body, just transfer
                }
                else if (this.msg.body === null) {
                    this.type = types_1.TraceType.TRANSFER;
                }
                else {
                    this.type = types_1.TraceType.FUNCTION_CALL;
                }
                return;
            // extIn - deploy or function call
            case 1:
                if (this.msg.code_hash !== null) {
                    this.type = types_1.TraceType.DEPLOY;
                }
                else {
                    this.type = types_1.TraceType.FUNCTION_CALL;
                }
                return;
            // extOut - event or return
            case 2:
                // if this msg was produced by extIn msg, this can be return or event
                if (this.src_trace !== null && this.src_trace.msg.msg_type === 1) {
                    this.type = types_1.TraceType.EVENT_OR_FUNCTION_RETURN;
                }
                else {
                    this.type = types_1.TraceType.EVENT;
                }
                return;
            default:
                return;
        }
    }
}
exports.Trace = Trace;
