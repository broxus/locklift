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
        const msg_query = `{messages(filter:{id:{eq:"${in_msg_id}"}}){id,body,code_hash,src,msg_type,dst,dst_transaction{status,out_msgs,compute{exit_code}},status,value,bounced,bounce}}`;
        const msgs = (await locklift.ton.client.net.query({ "query": msg_query })).result.data.messages;

        const msg = msgs[0];
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
            return await this.buildTracingTree(msg_tree);
        }
    }
}


module.exports = Tracing;
