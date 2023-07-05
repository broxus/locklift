import {Addressable, AllowedCodes, MessageTree, RevertedBranch, TraceType, TruncatedTransaction} from "./types";
import {logger} from "../logger";
import {Address, TransactionWithAccount} from "everscale-inpage-provider";
import BigNumber from "bignumber.js";
import {decodeRawTransaction, JsRawMessage} from "nekoton-wasm";


const popKey= (obj: any, key: string): any => {
  const value = obj[key];
  delete obj[key];
  return value;
}

// transactions are unordered
// @ts-ignore
export const buildMsgTree = (transactions: TransactionWithAccount[]): MessageTree => {
  type _ShortMessageTree = JsRawMessage & {
    dstTransaction: TruncatedTransaction;
    outMessages: Array<JsRawMessage>;
  }
  // restructure transaction inside out for more convenient access in later processing
  const hashToMsg: {[msg_hash: string]: _ShortMessageTree} = {};
  const msgs = transactions.map((tx): _ShortMessageTree => {
    const extendedTx = decodeRawTransaction(tx.boc);
    const inMsg: JsRawMessage = popKey(extendedTx, "inMessage");
    const description = popKey(extendedTx, "description");
    const outMsgs: JsRawMessage[] = popKey(extendedTx, "outMessages");
    const msg: _ShortMessageTree = {...inMsg, dstTransaction: {...extendedTx, ...description}, outMessages: outMsgs};
    hashToMsg[msg.hash] = msg;
    return msg;
  });

  // recursively build message tree
  const buildTree = (msgHash: string): MessageTree => {
    const msg = hashToMsg[msgHash];
    const outMessages = msg.outMessages.map((outMsg) => buildTree(outMsg.hash));
    return {...msg, outMessages};
  }

  return buildTree(msgs[0].hash);
}

export const extractAccountsFromMsgTree = (msgTree: MessageTree): Address[] => {
  const extractAccounts = (msgTree: MessageTree): Address[] => {
    const accounts: Address[] = [new Address(msgTree.dst)];
    for (const outMsg of msgTree.outMessages) {
      accounts.push(...extractAccounts(outMsg));
    }
    return accounts;
  }
  return [...new Set(extractAccounts(msgTree))];
}

export const convert = (number: number, decimals = 9, precision = 4) => {
  if (number === null) {
    return null;
  }
  return (number / 10 ** decimals).toPrecision(precision);
};

export const convertForLogger = (amount: number) => new BigNumber(convert(amount, 9, 8) || 0);
export const hexToValue = (amount: number) => new BigNumber(convert(amount, 9, 9) || 0);

export const throwErrorInConsole = <Abi>(revertedBranch: Array<RevertedBranch<Abi>>) => {
  for (const { totalActions, actionIdx, traceLog } of revertedBranch) {
    const bounce = traceLog.msg.bounce;
    let name = "undefinedContract";
    if (traceLog.contract) {
      name = traceLog.contract.name;
    }
    let method = "undefinedMethod";
    if (traceLog.decodedMsg?.method) {
      method = traceLog.decodedMsg.method;
    } else if (traceLog.type === TraceType.BOUNCE) {
      method = "onBounce";
    }
    let paramsStr = "()";
    if (traceLog.decodedMsg) {
      if (Object.values(traceLog.decodedMsg.params || {}).length === 0) {
        paramsStr = "()";
      } else {
        paramsStr = "(\n";
        for (const [key, value] of Object.entries(traceLog.decodedMsg.params || {})) {
          paramsStr += `    ${key}: ${JSON.stringify(value, null, 4)}\n`;
        }
        paramsStr += ")";
      }
    }

    logger.printTracingLog("\t\t⬇\n\t\t⬇");
    logger.printTracingLog(`\t#${actionIdx + 1} action out of ${totalActions}`);
    // green tags
    logger.printTracingLog(`Addr: \x1b[32m${traceLog.msg.dst}\x1b[0m`);
    logger.printTracingLog(`MsgId: \x1b[32m${traceLog.msg.hash}\x1b[0m`);
    logger.printTracingLog("-----------------------------------------------------------------");
    if (traceLog.type === TraceType.BOUNCE) {
      logger.printTracingLog("-> Bounced msg");
    }
    if (traceLog.error && traceLog.error.ignored) {
      logger.printTracingLog(`-> Ignored ${traceLog.error.code} code on ${traceLog.error.phase} phase`);
    }
    if (!traceLog.contract) {
      logger.printTracingLog("-> Contract not deployed/Not recognized because build artifacts not provided");
    }
    // bold tag
    logger.printTracingLog(
      `\x1b[1m${name}.${method}\x1b[22m{value: ${convert(traceLog.msg.value)}, bounce: ${bounce}}${paramsStr}`,
    );
    if (traceLog.msg.dstTransaction) {
      if (traceLog.msg.dstTransaction.storage) {
        logger.printTracingLog(`Storage fees: ${convert(traceLog.msg.dstTransaction.storage.storageFeesCollected)}`);
      }
      if (traceLog.msg.dstTransaction.compute) {
        logger.printTracingLog(`Compute fees: ${convert(Number(traceLog.msg.dstTransaction.compute.gasFees))}`);
      }
      if (traceLog.msg.dstTransaction.action) {
        logger.printTracingLog(
          `Action fees: ${convert(Number(traceLog.msg.dstTransaction.action.totalActionFees))}`,
        );
      }
      logger.printTracingLog(`\x1b[1mTotal fees:\x1b[22m ${convert(Number(traceLog.msg.dstTransaction.totalFees))}`);
    }
    if (traceLog.error && !traceLog.error.ignored) {
      // red tag
      logger.printError(
        "\x1b[31m",
        `!!! Reverted with ${traceLog.error.code} error code on ${traceLog.error.phase} phase !!!`,
      );
      throw new Error(`Reverted with ${traceLog.error.code} code on ${traceLog.error.phase} phase`);
    }
  }
};
export const isT = <T>(p: T): p is NonNullable<T> => !!p;
export const getDefaultAllowedCodes = (): Omit<Required<AllowedCodes>, "contracts"> => ({
  compute: [],
  action: [],
});
export const isExistsInArr = <T>(srcArr: Array<T>, isExist: T): boolean => {
  return srcArr.some(item => item === isExist);
};

export const extractStringAddress = (contract: Addressable) =>
  typeof contract === "string"
    ? contract
    : contract instanceof Address
    ? contract.toString()
    : contract.address.toString();

export const extractAddress = (contract: Addressable): Address => new Address(extractStringAddress(contract));
