import { Addressable, AllowedCodes, MessageTree, RevertedBranch, TraceType, TruncatedTransaction } from "./types";
import { logger } from "../logger";
import { Address } from "everscale-inpage-provider";
import BigNumber from "bignumber.js";
import { Trace } from "./trace/trace";
import path from "path";
import * as process from "process";
import chalk from "chalk";
import { EngineTraceInfo } from "nekoton-wasm";
import { ActionCodeHints, ComputeCodesHints, CONSOLE_ADDRESS } from "./constants";

const fs = require("fs");

export const extractAccountsFromMsgTree = (msgTree: MessageTree): Address[] => {
  const extractAccounts = (msgTree: MessageTree): Address[] => {
    const accounts: Address[] = msgTree.dst && msgTree.dst !== CONSOLE_ADDRESS ? [new Address(msgTree.dst)] : [];
    for (const outMsg of msgTree.outMessages) {
      accounts.push(...extractAccounts(outMsg));
    }
    return accounts;
  };
  return [...new Set(extractAccounts(msgTree))];
};

export const convert = (number: number, decimals = 9, precision = 4): string => {
  return (number / 10 ** decimals).toPrecision(precision);
};

export const convertForLogger = (amount: number) => new BigNumber(convert(amount, 9, 8) || 0);
export const hexToValue = (amount: number) => new BigNumber(convert(amount, 9, 9) || 0);

type ErrorPosition = {
  filename: string;
  line: number;
};

const normalizeFilePath = (errorPosition: ErrorPosition) => {
  let errFilePath = errorPosition.filename;
  // contracts paths look like: "../contracts/ContractName.tsol"
  if (errFilePath.startsWith("../contracts/")) {
    errFilePath = path.resolve(process.cwd(), errFilePath.split("../")[1]);
  }
  // .code paths look like: "ContractName.code"
  if (errFilePath.endsWith(".code")) {
    errFilePath = path.resolve(process.cwd(), "build", errFilePath);
  }
  return errFilePath;
};

const printErrorPositionSnippet = (trace: Trace, filename: string, errLine: number, offset: number) => {
  const errFile = fs.readFileSync(filename, "utf8");
  const lines = errFile.split("\n");
  const lastLineLen = `${errLine + offset}`.length;

  const { name, method } = getContractNameAndMethod(trace);

  logger.printTracingLog(
    "".padStart(lastLineLen - 1, " "),
    chalk.blueBright.bold("-->"),
    chalk.bold(`${name}.${method} (${path.basename(filename)}:${errLine})`),
  );

  logger.printTracingLog("".padStart(lastLineLen, " "), chalk.blueBright.bold("|"));
  const linesToPrint: string[][] = [];
  lines.map((line: string, i: number) => {
    if (i < errLine - offset - 1 || i >= errLine + offset) return;
    const lineNum = `${i + 1}`.padEnd(lastLineLen, " ");
    if (i === errLine - 1) {
      linesToPrint.push([chalk.redBright.bold(`${lineNum} |`), chalk.redBright(line)]);
    } else {
      linesToPrint.push([chalk.blueBright.bold(`${lineNum} |`), line]);
    }
  });

  const firstNotEmpty = linesToPrint.findIndex(line => line[1].trim() !== "");
  const lastNotEmpty = linesToPrint.length - linesToPrint.reverse().findIndex(line => line[1].trim() !== "");

  linesToPrint
    .reverse()
    .slice(firstNotEmpty, lastNotEmpty)
    .map(line => {
      logger.printTracingLog(...line);
    });

  logger.printTracingLog("".padStart(lastLineLen, " "), chalk.blueBright.bold("|"));
};

export const throwTrace = (trace: Trace) => {
  // const _trace = trace.transactionTrace!.map((trace) => JSON.stringify(trace)).join('\n');
  // fs.writeFileSync('log.json', _trace);

  logger.printTracingLog(chalk.redBright("-----------------------------------------------------------------"));
  // SKIPPED COMPUTE PHASE
  if (trace.error?.phase === "compute" && trace.error?.reason) {
    let errorDescription: string = trace.error?.reason;
    if (errorDescription === "NoState") {
      errorDescription = "NoState. Looks like you tried to call method of contract that doesn't exist";
    }
    const errorMsg = `!!! Compute phase was skipped with reason: ${errorDescription} !!!`;
    logger.printError(errorMsg);
    throw new Error(errorMsg);
  }

  let errorDescription = "";
  if (trace.error?.phase === "action") {
    errorDescription = ActionCodeHints[Number(trace.error.code)];
  }
  if (trace.error?.phase === "compute") {
    errorDescription = ComputeCodesHints[Number(trace.error.code)];
  }

  // short common error description
  const mainErrorMsg = `!!! Reverted with ${trace.error?.code} error code on ${trace.error?.phase} phase !!!`;
  logger.printError(mainErrorMsg);
  logger.printError(errorDescription);
  logger.printTracingLog(chalk.redBright("-----------------------------------------------------------------"));

  // no trace -> we cant detect line with error
  if (trace.transactionTrace === undefined) throw new Error(mainErrorMsg);
  const vmTraces = trace.transactionTrace;

  // no debug-map -> we cant detect line with error
  if (trace.contract.map === undefined) throw new Error(mainErrorMsg);
  const contract = trace.contract;

  const tx = trace.msg.dstTransaction as TruncatedTransaction;
  let errPosition: ErrorPosition | undefined;
  // COMPUTE PHASE ERROR
  if (tx.compute.status === "vm" && !tx.compute.success) {
    // last vm step is the error position
    const lastStep = vmTraces.pop() as EngineTraceInfo;
    errPosition = contract.map[lastStep.cmdCodeCellHash][lastStep.cmdCodeOffset];
    if (errPosition === undefined) throw new Error(mainErrorMsg);
  }
  // ACTION PHASE ERROR
  if (tx.action?.success === false) {
    // catch all vm steps, where actions are produced
    const actionsSent = vmTraces.filter(
      t => t.cmdStr === "SENDRAWMSG" || t.cmdStr === "RAWRESERVE" || t.cmdStr === "SETCODE",
    );
    let failedAction = tx.action.resultArg;
    // too many actions, point to 256th action
    if (Number(tx.action.resultCode) === 33) failedAction = 255;

    const failedActionStep = actionsSent[failedAction];
    errPosition = contract.map[failedActionStep.cmdCodeCellHash][failedActionStep.cmdCodeOffset];
    if (errPosition === undefined) throw new Error(mainErrorMsg);
  }

  const errFilePath = normalizeFilePath(errPosition as ErrorPosition);
  const errLineNum = (errPosition as ErrorPosition).line;
  const filename = path.basename(errFilePath);
  if (filename.endsWith(".tsol") || filename.endsWith(".sol")) {
    printErrorPositionSnippet(trace, errFilePath, errLineNum, 2);
  }
  throw new Error(mainErrorMsg);
};

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
};

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
        const gasFees = tx.compute.status === "vm" ? tx.compute.gasFees : 0;
        logger.printTracingLog(`Compute fees: ${convert(Number(gasFees))}`);
      }
      if (tx.action) {
        logger.printTracingLog(`Action fees: ${convert(Number(tx.action.totalActionFees))}`);
      }
      logger.printTracingLog(chalk.bold("Total fees:"), `${convert(Number(tx.totalFees))}`);
      if (tx.compute.status === "vm") {
        const gasLimit = Number(tx.compute.gasLimit) === 0 ? 1000000 : Number(tx.compute.gasLimit);
        const percentage = ((tx.compute.gasUsed / gasLimit) * 100).toPrecision(2);
        logger.printTracingLog(
          chalk.bold("Gas used:"),
          `${Number(tx.compute.gasUsed).toLocaleString()}/${gasLimit.toLocaleString()} (${percentage}%)`,
        );
      }
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
