const Context = require('./context');


class Tracing {
    constructor(locklift) {
        this.locklift = locklift;
        this.context = new Context(locklift);
    }

    async setup() {
        // get abi of all contracts
    }

    addToContext(address, contract) {
        this.context.addContract(address, contract)
    }

    getContext() {
        return this.context.getContext()
    }

    async getMessageTree(in_msg_id) {
        const msg_query = `{messages(filter:{id:{eq:"${in_msg_id}"}}){body,src,msg_type,dst,dst_transaction{status,out_msgs,compute{exit_code}},status,value,bounced,bounce}}`;
        const msg = (await locklift.ton.client.net.query({ "query": msg_query })).result.data.messages[0];
        msg.out_messages = []
        if (msg.dst_transaction && msg.dst_transaction.out_msgs !== null) {
            msg.out_messages = await Promise.all(msg.dst_transaction.out_msgs.map(async (msg_id) => {
                return await this.getMessageTree(msg_id);
            }));
        }
        return msg;
    }
}



module.exports = Tracing;