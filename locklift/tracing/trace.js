const OutputDecoder = require('../contract/output-decoder');
const TraceType = {
    FUNCTION_CALL: 'function_call',
    FUNCTION_RETURN: 'function_return',
    DEPLOY: 'deploy',
    EVENT: 'event',
    EVENT_OR_FUNCTION_RETURN: 'event_or_return',
    BOUNCE: 'bounce',
    TRANSFER: 'transfer'
}


class Trace {
    constructor(tracing, msg, src_trace=null) {
        this.tracing = tracing;
        this.msg = msg; // msg tree
        this.src_trace = src_trace;
        this.out_traces = [];

        this.error = null;
        this.contract = null;
        this.type = null;
        this.decoded_msg = null;

        // this propagates to the root of trace tree if error occurred on any trace node
        this.has_error_in_tree = false;
    }

    async buildTree(allowed_codes={compute: [], action: []}) {
        this.setMsgType();
        this.checkForErrors(allowed_codes);
        await this.decode();
        for (const msg of this.msg.out_messages) {
            const trace = new Trace(this.tracing, msg, this);
            await trace.buildTree(allowed_codes);
            if (trace.has_error_in_tree) {
                this.has_error_in_tree = true;
            }
            this.out_traces.push(trace);
        }
    }

    // allowed_codes - {compute: [100, 50, 12], action: [11, 12]}
    checkForErrors(allowed_codes={compute: [], action: []}) {
        const tx = this.msg.dst_transaction;

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
            // if we expected this error, its ok
            if (allowed_codes.compute.indexOf(tx.compute.exit_code) === -1) {
                this.error = {phase: 'compute', code: tx.compute.exit_code}
            }
        } else if (!skip_action_check && tx && tx.action && tx.action.result_code !== 0) {
            this.error = {phase: 'action', code: tx.action.result_code}
        }
        if (this.error) {
            this.has_error_in_tree = true;
        }
    }

    async decodeMsg() {
        if (this.type === TraceType.TRANSFER || this.type === TraceType.BOUNCE) {
            return;
        }

        if (this.type === TraceType.FUNCTION_CALL && this.src_trace) {
            // this is responsible callback with answerId = 0, we cant decode it, however contract doesnt need it too
            if (this.src_trace.decoded_msg && this.src_trace.decoded_msg.value.answerId === '0') {
                return;
            }
        }

        // function call, but we dont have contract here => we cant decode msg
        if (this.type === TraceType.FUNCTION_CALL && !this.contract) {
            return;
        }

        const is_internal = this.msg.msg_type === 0;
        this.decoded_msg = await this.tracing.locklift.ton.client.abi.decode_message_body({
            abi: {
                type: 'Contract',
                value: this.contract.abi
            },
            body: this.msg.body,
            is_internal: is_internal
        });

        // determine more precisely is it an event or function return
        if (this.type === TraceType.EVENT_OR_FUNCTION_RETURN) {
            const is_function_return = this.contract.abi.functions.find(({ name }) => name === this.decoded_msg.name);
            if (is_function_return) {
                this.type = TraceType.FUNCTION_RETURN;
            } else {
                this.type = TraceType.EVENT;
            }
        }
        this.decoded_params = OutputDecoder.autoDecode(this.decoded_msg, this.contract.abi);

        if (this.type === TraceType.DEPLOY && this.contract.name === 'Platform') {
            // replace with real contract
            await this.initContractByCode(this.decoded_msg.value.code);
            console.log(`Replced platform with ${this.contract.name}`);
            this.contract.platform = true;
        }
    }


    // find which contract is deployed in this msg by code hash
    async initContract() {
        for (const contract_data of Object.values(this.tracing.locklift.factory.artifacts)) {
            if (contract_data.code_hash === this.msg.code_hash) {
                this.contract = await this.tracing.locklift.factory.getContract(contract_data.name, contract_data.build);
                this.contract.setAddress(this.msg.dst); // added to context automatically
                return;
            }
        }
    }

    async initContractByCode(code) {
        for (const contract_data of Object.values(this.tracing.locklift.factory.artifacts)) {
            if (contract_data.code === code) {
                this.contract = await this.tracing.locklift.factory.getContract(contract_data.name, contract_data.build);
                this.contract.setAddress(this.msg.dst); // added to context automatically
                return;
            }
        }
    }

    async decode() {
        switch (this.type) {
            case TraceType.DEPLOY:
                await this.initContract();
                break;
            case TraceType.FUNCTION_CALL:
                // get contract from context
                this.contract = this.tracing.getFromContext(this.msg.dst);
                break;
            case TraceType.EVENT:
                this.contract = this.tracing.getFromContext(this.msg.src);
                break;
            case TraceType.EVENT_OR_FUNCTION_RETURN:
                this.contract = this.tracing.getFromContext(this.msg.src);
        }
        await this.decodeMsg();
    }

    setMsgType() {
        switch (this.msg.msg_type) {
            // internal - deploy or function call or bound or transfer
            case 0:
                // code hash is presented, deploy
                if (this.msg.code_hash !== null) {
                    this.type = TraceType.DEPLOY;
                    // bounced msg
                } else if (this.msg.bounced === true) {
                    this.type = TraceType.BOUNCE;
                    // empty body, just transfer
                } else if (this.msg.body === null) {
                    this.type = TraceType.TRANSFER;
                } else {
                    this.type = TraceType.FUNCTION_CALL;
                }
                return;
            // extIn - deploy or function call
            case 1:
                if (this.msg.code_hash !== null) {
                    this.type = TraceType.DEPLOY;
                } else {
                    this.type = TraceType.FUNCTION_CALL;
                }
                return;
            // extOut - event or return
            case 2:
                // if this msg was produced by extIn msg, this can be return or event
                if (this.src_trace !== null && this.src_trace.msg.msg_type === 1) {
                    this.type = TraceType.EVENT_OR_FUNCTION_RETURN;
                } else {
                    this.type = TraceType.EVENT;
                }
                return;
            default:
                return;
        }
    }
}

module.exports = {
    Trace,
    TraceType
}
