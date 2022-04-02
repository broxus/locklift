
const TraceType = {
    FUNCTION_CALL: 'function_call',
    DEPLOY: 'deploy',
    EVENT: 'event',
    EVENT_OR_RETURN: 'event_or_return',
    BOUNCE: 'bounce',
    TRANSFER: 'transfer'
}


class Trace {
    constructor(tracing, msg, src_trace=null) {
        this.tracing = tracing;
        this.msg = msg; // msg tree
        this.src_trace = src_trace;
        this.out_traces = [];
    }

    async buildTree() {
        this.setType();
        this.decode();
        this.out_traces = await Promise.all(this.msg.out_messages.map(async (msg) => {
            const trace = new Trace(this.tracing, msg, this);
            await trace.buildTree();
            return trace;
        }));
    }

    async decodeMsg() {
        const is_internal = this.msg.msg_type === 0;
        this.decoded_msg = await this.locklift.ton.client.abi.decode_message_body({
            abi: {
                type: 'Contract',
                value: this.contract.abi
            },
            body: this.msg.body,
            is_internal: is_internal
        });
    }

    // find which contract is deployed in this msg by code hash
    async initContract() {
        for (const contract_data of Object.values(this.tracing.locklift.factory.artifacts)) {
            if (contract_data.code_hash === this.msg.code_hash) {
                this.contract = await this.tracing.locklift.factory.getContract(contract_data.name);
                this.contract.setAddress(this.msg.dst); // added to context automatically
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
                this.contract = this.tracing.getFromContext(this.msg.dst);
                break;
            case TraceType.EVENT_OR_RETURN:
                this.contract = this.tracing.getFromContext(this.msg.dst);
            // TODO: determine event or return
        }
        await this.decodeMsg();
    }

    setType() {
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
                    this.type = TraceType.EVENT_OR_RETURN;
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
