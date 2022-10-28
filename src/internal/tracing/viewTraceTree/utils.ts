import { BalanceChangeInfoStorage, MsgError, TraceType, ViewTraceTree, ViewTraceTreeWithTotalFee } from "../types";
import chalk from "chalk";

import { ContractWithName } from "../../../types";
import { convertForLogger } from "../utils";

import { extractFeeAndSentValueFromMessage, mapParams } from "./mappers";
import BigNumber from "bignumber.js";
import _ from "lodash";

export const mapType: Record<TraceType, string> = {
  [TraceType.BOUNCE]: "BONCE",
  [TraceType.DEPLOY]: "DEPLOY",
  [TraceType.EVENT]: "EVENT",
  [TraceType.EVENT_OR_FUNCTION_RETURN]: "EVENT_OR_RETURN",
  [TraceType.FUNCTION_CALL]: "CALL",
  [TraceType.FUNCTION_RETURN]: "RETURN",
  [TraceType.TRANSFER]: "TRANSFER",
};

export const colors: Record<"contractName" | "methodName" | "paramsKey" | "error", (param?: string) => string> = {
  contractName: chalk.cyan,
  methodName: chalk.blueBright,
  paramsKey: chalk.magenta,
  error: chalk.red,
};

export const applyTotalFees = (viewTrace: ViewTraceTree): ViewTraceTreeWithTotalFee => {
  return {
    ...viewTrace,
    ...extractFeeAndSentValueFromMessage(viewTrace),
    outTraces: viewTrace.outTraces.map(applyTotalFees),
  };
};

export const calculateTotalFees = (traceTree: ViewTraceTreeWithTotalFee): BigNumber => {
  return traceTree.totalFees.plus(
    traceTree.outTraces
      .map(internalTraceTree => calculateTotalFees(internalTraceTree))
      .reduce((acc, next) => acc.plus(next), new BigNumber(0)),
  );
};

export const printer = (
  {
    type,
    decodedMsg,
    contract,
    totalFees,
    sentValue,
    value,
    balanceChange,
    error,
  }: Pick<
    ViewTraceTreeWithTotalFee,
    "type" | "decodedMsg" | "msg" | "contract" | "totalFees" | "sentValue" | "value" | "balanceChange" | "error"
  >,
  { contracts }: { contracts: Array<ContractWithName | undefined> },
): string => {
  const valueParams = `{valueReceive: ${convertForLogger(value.toNumber())},valueSent: ${convertForLogger(
    sentValue.toNumber(),
  )}, rest: ${convertForLogger(Number(balanceChange.toFixed(10)))}${
    balanceChange.isLessThan(0) ? chalk.red("⮯") : chalk.green("⮬")
  }, totalFees: ${convertForLogger(totalFees.toNumber())}}`;

  const header = `${type && mapType[type]}${
    error ? ` ERROR (phase: ${error.phase}, code: ${error.code})` : ""
  } ${colors.contractName(contract.name)}.${colors.methodName(decodedMsg?.method)}${
    type === TraceType.EVENT ? "" : valueParams
  }`;
  const printMsg = `${header}(${Object.entries(mapParams(decodedMsg?.params, contracts))
    .map(([key, value]) => `${colors.paramsKey(key)}=${JSON.stringify(value)}, `)
    .join("")
    .split(", ")
    .slice(0, -1)
    .join(", ")})`;
  return error ? colors.error(printMsg) : printMsg;
};

export type BalanceChangingInfo = {
  totalReceive: BigNumber;
  totalSent: BigNumber;
  balanceDiff: BigNumber;
};

type BalanceChangeInfo = Record<string, Omit<BalanceChangingInfo, "balanceDiff">>;
export const getBalanceChangingInfo = (
  viewTrace: ViewTraceTreeWithTotalFee,
  accumulator: BalanceChangeInfo = {},
): BalanceChangeInfo => {
  const contractAddress = viewTrace.contract?.contract.address.toString();
  if (!(viewTrace.contract?.contract?.address.toString() in accumulator)) {
    accumulator[contractAddress] = {
      totalReceive: new BigNumber(0),
      totalSent: new BigNumber(0),
    };
  }
  const { totalSent, totalReceive } = accumulator[contractAddress];
  accumulator[contractAddress] = {
    totalReceive: totalReceive.plus(viewTrace.msg.value || 0),
    totalSent: totalSent.plus(viewTrace.sentValue || 0).plus(viewTrace.totalFees),
  };
  return {
    ...accumulator,
    ...viewTrace.outTraces.reduce((acc, next) => {
      return { ...acc, ...getBalanceChangingInfo(next, accumulator) };
    }, {} as BalanceChangeInfo),
  };
};
export const getBalanceDiff = (balanceChangeInfo: BalanceChangeInfo): BalanceChangeInfoStorage => {
  return Object.entries(balanceChangeInfo).reduce((acc, [address, { totalSent, totalReceive }]) => {
    return { ...acc, [address]: { balanceDiff: totalReceive.minus(totalSent) } };
  }, {} as BalanceChangeInfoStorage);
};
type ErrorInfoStorage = Record<string, Array<MsgError>>;
export const getErrorsInfo = (
  viewTrace: ViewTraceTreeWithTotalFee,
  accumulator: ErrorInfoStorage = {},
): ErrorInfoStorage => {
  if (viewTrace.error) {
    const newError = {
      code: viewTrace.error.code,
      phase: viewTrace.error.phase,
      trace: _(viewTrace).omit("outTraces").value(),
    };
    const address = viewTrace.contract?.contract?.address.toString();
    if (!(address in accumulator)) {
      accumulator[address] = [];
    }
    accumulator[address].push(newError);
  }

  return {
    ...accumulator,
    ...viewTrace.outTraces.reduce(
      (acc, internalTrace) => ({ ...acc, ...getErrorsInfo(internalTrace, accumulator) }),
      {},
    ),
  };
};
