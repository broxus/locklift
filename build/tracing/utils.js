"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwErrorInConsole = exports.convert = exports.fetchMsgData = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("./types");
const fetchMsgData = async (msgId, endPoint) => {
    const msgQuery = `{
    messages(
      filter: {
        id: {
          eq: "${msgId}"
        }
      }
    ) {
      id
      body
      code_hash
      src
      msg_type
      dst
      dst_account {
        id
        code_hash
      }
      src_account{
        id
        code_hash
      }
      dst_transaction {
        status
        total_fees
        aborted
        out_msgs
        storage {
          storage_fees_collected
        }
        compute {
          exit_code
          compute_type
          success
          gas_fees
        }
        action {
          result_code
          success
          total_action_fees
        }
      }
      status
      value
      bounced
      bounce
    }
  }`;
    const response = await axios_1.default
        .post(endPoint, { query: msgQuery })
        .then(res => res.data.data);
    return response.messages[0];
};
exports.fetchMsgData = fetchMsgData;
const convert = (number, decimals = 9, precision = 4) => {
    if (number === null) {
        return null;
    }
    return (number / 10 ** decimals).toPrecision(precision);
};
exports.convert = convert;
const throwErrorInConsole = (revertedBranch) => {
    debugger;
    for (const { totalActions, actionIdx, traceLog } of revertedBranch) {
        const bounce = traceLog.msg.bounce;
        let name = "undefinedContract";
        if (traceLog.contract) {
            name = traceLog.contract.name;
        }
        let method = "undefinedMethod";
        if (traceLog.decodedMsg?.method) {
            method = traceLog.decodedMsg.method;
        }
        else if (traceLog.type === types_1.TraceType.BOUNCE) {
            method = "onBounce";
        }
        let paramsStr = "()";
        if (traceLog.decodedMsg) {
            if (Object.values(traceLog.decodedMsg.params || {}).length === 0) {
                paramsStr = "()";
            }
            else {
                paramsStr = "(\n";
                for (const [key, value] of Object.entries(traceLog.decodedMsg.params || {})) {
                    paramsStr += `    ${key}: ${value}\n`;
                }
                paramsStr += ")";
            }
        }
        console.log("\t\t⬇\n\t\t⬇");
        console.log(`\t#${actionIdx + 1} action out of ${totalActions}`);
        // green tags
        console.log(`Addr: \x1b[32m${traceLog.msg.dst}\x1b[0m`);
        console.log(`MsgId: \x1b[32m${traceLog.msg.id}\x1b[0m`);
        console.log("-----------------------------------------------------------------");
        if (traceLog.type === types_1.TraceType.BOUNCE) {
            console.log("-> Bounced msg");
        }
        if (traceLog.error && traceLog.error.ignored) {
            console.log(`-> Ignored ${traceLog.error.code} code on ${traceLog.error.phase} phase`);
        }
        if (!traceLog.contract) {
            console.log("-> Contract not deployed/Not recognized because build artifacts not provided");
        }
        // bold tag
        console.log(`\x1b[1m${name}.${method}\x1b[22m{value: ${(0, exports.convert)(traceLog.msg.value)}, bounce: ${bounce}}${paramsStr}`);
        if (traceLog.msg.dst_transaction) {
            if (traceLog.msg.dst_transaction.storage) {
                console.log(`Storage fees: ${(0, exports.convert)(traceLog.msg.dst_transaction.storage.storage_fees_collected)}`);
            }
            if (traceLog.msg.dst_transaction.compute) {
                console.log(`Compute fees: ${(0, exports.convert)(Number(traceLog.msg.dst_transaction.compute.gas_fees))}`);
            }
            if (traceLog.msg.dst_transaction.action) {
                console.log(`Action fees: ${(0, exports.convert)(Number(traceLog.msg.dst_transaction.action.total_action_fees))}`);
            }
            console.log(`\x1b[1mTotal fees:\x1b[22m ${(0, exports.convert)(Number(traceLog.msg.dst_transaction.total_fees))}`);
        }
        if (traceLog.error && !traceLog.error.ignored) {
            // red tag
            console.log("\x1b[31m", `!!! Reverted with ${traceLog.error.code} error code on ${traceLog.error.phase} phase !!!`);
            throw new Error(`Reverted with ${traceLog.error.code} code on ${traceLog.error.phase} phase`);
        }
    }
};
exports.throwErrorInConsole = throwErrorInConsole;
