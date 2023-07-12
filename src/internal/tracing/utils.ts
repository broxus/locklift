import {Addressable, AllowedCodes, MessageTree, RevertedBranch, TraceType} from "./types";
import {logger} from "../logger";
import {Address} from "everscale-inpage-provider";
import BigNumber from "bignumber.js";
import {Trace} from "./trace/trace";
import path from "path";
import * as process from "process";
import chalk from "chalk";

const fs = require('fs');

export const extractAccountsFromMsgTree = (msgTree: MessageTree): Address[] => {
  const extractAccounts = (msgTree: MessageTree): Address[] => {
    const accounts: Address[] = msgTree.dst ? [new Address(msgTree.dst)] : [];
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

type ErrorPosition = {
  filename: string,
  line: number
}


const normalizeFilePath = (errorPosition: ErrorPosition) => {
  let errFilePath = errorPosition.filename;
  // contracts paths look like: "../contracts/ContractName.tsol"
  if (errFilePath.startsWith('../contracts/')) {
    errFilePath = path.resolve(process.cwd(), errFilePath.split('../')[1]);
  }
  // .code paths look like: "ContractName.code"
  if (errFilePath.endsWith('.code')) {
    errFilePath = path.resolve(process.cwd(), 'build', errFilePath);
  }
  return errFilePath;
}


const printErrorPositionPrediction = (trace: Trace, filename: string, errLine: number, offset: number) => {
  const err_file = fs.readFileSync(filename, 'utf8');
  let lines = err_file.split('\n');
  const lastLineLen = `${errLine + offset}`.length;

  const {name, method} = getContractNameAndMethod(trace);

  logger.printTracingLog(
    ''.padStart(lastLineLen - 1, ' '),
    chalk.blueBright.bold('-->'),
    chalk.bold(`${name}.${method} (${path.basename(filename)}:${errLine})`)
  )


  logger.printTracingLog(''.padStart(lastLineLen, ' '), chalk.blueBright.bold('|'));
  let linesToPrint: string[][] = [];
  lines.map((line:string, i:number) => {
    if (i < (errLine - offset - 1) || i >=  (errLine + offset)) return;
    const lineNum = `${i + 1}`.padEnd(lastLineLen, ' ');
    if (i === errLine - 1) {
      linesToPrint.push([chalk.redBright.bold(`${lineNum} |`), chalk.redBright(line)]);
    } else {
      linesToPrint.push([chalk.blueBright.bold(`${lineNum} |`), line]);
    }
  });

  const firstNotEmpty = linesToPrint.findIndex((line) => line[1].trim() !== '');
  const lastNotEmpty = linesToPrint.length - linesToPrint.reverse().findIndex((line) => line[1].trim() !== '');

  linesToPrint.reverse().slice(firstNotEmpty, lastNotEmpty).map((line) => {
    logger.printTracingLog(...line)
  })

  logger.printTracingLog(''.padStart(lastLineLen, ' '), chalk.blueBright.bold('|'));
}

export const throwTrace = (trace: Trace) => {
  // SKIPPED COMPUTE PHASE
  if (trace.error!.phase === 'compute' && trace.error!.reason) {
    let extendedReason: string = trace.error!.reason;
    if (extendedReason === 'NoState') {
      extendedReason = "NoState. Looks like you tried to call a method of a contract that doesn't exist";
    }
    const errorMsg = `!!! Compute phase was skipped with reason: ${extendedReason} !!!`;
    logger.printError(errorMsg);
    throw new Error(errorMsg);
  }

  // short common error description
  const mainErrorMsg = `!!! Reverted with ${trace.error!.code} error code on ${trace.error!.phase} phase !!!`;
  logger.printError(mainErrorMsg);

  // no trace -> we cant detect line with error
  if (trace.transactionTrace === undefined) throw new Error(mainErrorMsg);
  const vmTraces = trace.transactionTrace;

  // no debug-map -> we cant detect line with error
  if (trace.contract.map === undefined) throw new Error(mainErrorMsg);
  const contract = trace.contract;

  const tx = trace.msg.dstTransaction!;
  let errFilePath: string;
  let errLineNum: number;
  // COMPUTE PHASE ERROR
  if (tx.compute.status === 'vm' && !tx.compute.success) {
    // last vm step is the error position
    const lastStep = vmTraces.pop()!;
    const errPosition: ErrorPosition | undefined = contract.map.map[lastStep.cmdCodeCellHash][lastStep.cmdCodeOffset];
    if (errPosition === undefined) throw new Error(mainErrorMsg);
    errFilePath = normalizeFilePath(errPosition);
    errLineNum = errPosition.line;
  }
  // ACTION PHASE ERROR
  if (tx.action?.success === false) {
    // TODO: case with too many actions
    // catch all vm steps, where actions are produced
    const actions_sent = vmTraces.filter(
      (t) => (t.cmdStr === 'SENDRAWMSG' || t.cmdStr === 'RAWRESERVE' || t.cmdStr === 'SETCODE')
    );

    const failed_action_step = actions_sent[tx.action.resultArg];
    const errPosition: ErrorPosition | undefined = contract.map.map[failed_action_step.cmdCodeCellHash][failed_action_step.cmdCodeOffset];
    if (errPosition === undefined) throw new Error(mainErrorMsg);
    errFilePath = normalizeFilePath(errPosition);
    errLineNum = errPosition.line;
  }
  console.log(errFilePath!);
  const filename = path.basename(errFilePath!);
  if (filename.endsWith('.tsol') || filename.endsWith('.sol')) {
    printErrorPositionPrediction(trace, errFilePath!, errLineNum!, 4);
  }
  throw new Error(mainErrorMsg);
}

const getContractNameAndMethod = (trace: Trace) => {
  let name = "undefinedContract";
  if (trace.contract) {
    name = trace.contract.name;
  }
  let method = "undefinedMethod";
  if (trace.decodedMsg?.method) {
    method = trace.decodedMsg.method;
  } else if (trace.type === TraceType.BOUNCE) {
    method = "onBounce";
  }
  return { name, method };
}

export const throwErrorInConsole = <Abi>(revertedBranch: Array<RevertedBranch<Abi>>) => {
  for (const { totalActions, actionIdx, traceLog } of revertedBranch) {
    const bounce = traceLog.msg.bounce;
    const { name, method } = getContractNameAndMethod(traceLog);
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
      `\x1b[1m${name}.${method}\x1b[22m{value: ${convert(Number(traceLog.msg.value))}, bounce: ${bounce}}${paramsStr}`,
    );
    if (traceLog.msg.dstTransaction) {
      const tx = traceLog.msg.dstTransaction;
      if (tx.storage) {
        logger.printTracingLog(`Storage fees: ${convert(tx.storage.storageFeesCollected)}`);
      }
      if (tx.compute) {
        const gasFees = tx.compute.status === 'vm' ? tx.compute.gasFees : 0;
        logger.printTracingLog(`Compute fees: ${convert(Number(gasFees))}`);
      }
      if (tx.action) {
        logger.printTracingLog(
          `Action fees: ${convert(Number(tx.action.totalActionFees))}`,
        );
      }
      logger.printTracingLog(`\x1b[1mTotal fees:\x1b[22m ${convert(Number(tx.totalFees))}`);
    }
    if (traceLog.error && !traceLog.error.ignored) {
      throwTrace(traceLog);
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
