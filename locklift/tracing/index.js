const Context = require('./context');
const { Trace } = require('./trace');


class Tracing {
    constructor(locklift, enabled=false) {
        this.locklift = locklift;
        this.context = new Context(locklift);
        this.enabled = enabled;
    }

    async setup() {}

    addToContext(address, contract) {
        this.context.addContract(address, contract)
    }

    getContext() {
        return this.context.getContext()
    }

    getFromContext(address) {
        return this.context.getContract(address)
    }

    async buildMsgTree(in_msg_id) {
        const msg_query = `{messages(filter:{id:{eq:"${in_msg_id}"}}){id,body,code_hash,src,msg_type,dst,dst_transaction{status,out_msgs,compute{exit_code},action{result_code}},status,value,bounced,bounce}}`;
        const msg = (await locklift.ton.client.net.query({ "query": msg_query })).result.data.messages[0];
        msg.out_messages = [];
        if (msg.dst_transaction && msg.dst_transaction.out_msgs.length > 0) {
            msg.out_messages = await Promise.all(msg.dst_transaction.out_msgs.map(async (msg_id) => {
                return await this.buildMsgTree(msg_id);
            }));
        }
        return msg;
    }

    async buildTracingTree(msg_tree) {
        const trace = new Trace(this, msg_tree);
        await trace.buildTree();
        return trace;
    }

    async trace({in_msg_id, force_trace=false, disable_trace=false}) {
        if (force_trace === true && disable_trace === true) {
            throw 'You cant force and disable tracing at the same time!'
        }
        const msg_tree = await this.buildMsgTree(in_msg_id);
        if (disable_trace) return;
        if (this.enabled || force_trace) {
            const trace_tree = await this.buildTracingTree(msg_tree);
            const reverted = this.findRevertedBranch(trace_tree);
            if (reverted) {
                this.throwErrorInConsole(reverted);
            }
        }
    }

    throwErrorInConsole(reverted_branch) {
        for (const {total_actions, action_idx, trace} of reverted_branch) {
            const msg_value = trace.msg.value / 10**9;
            const bounce = trace.msg.bounce;
            const name = trace.contract.name;
            const method = trace.decoded_msg.name;
            let params_str;
            if (Object.values(trace.decoded_params).length === 0) {
                params_str = `()`;
            } else {
                params_str = `(\n`;
                for (const [key, value] of Object.entries(trace.decoded_params)) {
                    params_str += `    ${key}: ${value}\n`
                }
                params_str += ')';
            }
            console.log('\t\t⬇\n\t\t⬇');
            console.log(`\t#${action_idx + 1} action out of ${total_actions}`)
            console.log(`Addr: \x1b[32m${trace.msg.dst}\x1b[0m`)
            console.log(`MsgId: \x1b[32m${trace.msg.id}\x1b[0m`)
            console.log(`${name}.${method}{value: ${msg_value.toPrecision(3)}, bounce: ${bounce}}${params_str}`)
            if (trace.error) {
                console.log('\x1b[31m', `!!! Reverted with ${trace.error.code} error code on ${trace.error.phase} phase !!!`)
                throw new Error(`Reverted with ${trace.error.code} error code on ${trace.error.phase} phase`)
            }
        }
    }

    // apply depth-first search on trace tree, return first found reverted branch
    findRevertedBranch(trace_tree) {
        if (trace_tree.has_error_in_tree !== true) {
            return;
        }
        return this.depthSearch(trace_tree, 1, 0);
    }

    depthSearch(trace_tree, total_actions, action_idx) {
        if (trace_tree.error) {
            // clean unnecessary structure
            trace_tree.out_traces = [];
            return [{total_actions: total_actions, action_idx: action_idx, trace: trace_tree}];
        }

        for (const [index, trace] of trace_tree.out_traces.entries()) {
            const actions_num = trace_tree.out_traces.length;
            const corrupted_branch = this.depthSearch(trace, actions_num, index);
            if (corrupted_branch) {
                // clean unnecessary structure
                trace_tree.out_traces = [];
                return [{total_actions: total_actions, action_idx: action_idx, trace: trace_tree}].concat(corrupted_branch);
            }
        }
        return null;
    }
}



module.exports = Tracing;
