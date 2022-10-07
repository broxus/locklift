import { TraceType, ViewTraceTree, ViewTraceTreeWithTotalFee } from "../types";
import chalk from "chalk";

import { ContractWithName } from "../../types";
import { convertForLogger } from "../utils";

import { extractFeeFromMessage, mapParams } from "./mappers";
import BigNumber from "bignumber.js";

export const mapType: Record<TraceType, string> = {
  [TraceType.BOUNCE]: "BONCE",
  [TraceType.DEPLOY]: "DEPLOY",
  [TraceType.EVENT]: "EVENT",
  [TraceType.EVENT_OR_FUNCTION_RETURN]: "EVENT_OR_RETURN",
  [TraceType.FUNCTION_CALL]: "CALL",
  [TraceType.FUNCTION_RETURN]: "RETURN",
  [TraceType.TRANSFER]: "TRANSFER",
};

export const colors: Record<"contractName" | "methodName" | "paramsKey", (param?: string) => string> = {
  contractName: chalk.cyan,
  methodName: chalk.blueBright,
  paramsKey: chalk.magenta,
};

export const applyTotalFees = (viewTrace: ViewTraceTree): ViewTraceTreeWithTotalFee => {
  return {
    ...viewTrace,
    totalFees: extractFeeFromMessage(viewTrace.msg),
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
    msg,
    contract,
    totalFees,
  }: Pick<ViewTraceTreeWithTotalFee, "type" | "decodedMsg" | "msg" | "contract" | "totalFees">,
  { valueSent, contracts }: { valueSent: number; contracts: Array<ContractWithName | undefined> },
): string => {
  const valueReceive = convertForLogger(msg.value);
  const totalFeesConverted = convertForLogger(totalFees.toNumber());
  const diff = valueReceive.minus(valueSent).minus(totalFeesConverted);

  const valueParams = `{valueReceive: ${valueReceive},valueSent: ${valueSent}, rest: ${diff.toFixed(10)}${
    diff.isLessThan(0) ? chalk.red("⮯") : chalk.green("⮬")
  }, totalFees: ${totalFeesConverted}}`;

  const header = `${type && mapType[type]} ${colors.contractName(contract.name)}.${colors.methodName(
    decodedMsg?.method,
  )}${type === TraceType.EVENT ? "" : valueParams}`;
  return `${header}(${Object.entries(mapParams(decodedMsg?.params, contracts))
    .map(([key, value]) => `${colors.paramsKey(key)}=${JSON.stringify(value)}, `)
    .join("")
    .split(", ")
    .slice(0, -1)
    .join(", ")})`;
};
