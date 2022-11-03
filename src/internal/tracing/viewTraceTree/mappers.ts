import { ViewTraceTree } from "../types";
import BigNumber from "bignumber.js";
import { ContractWithName } from "../../../types";
import _ from "lodash";
import { Address } from "everscale-inpage-provider";
import { isT } from "../utils";

export const extractFeeAndSentValueFromMessage = (
  traceTree: ViewTraceTree,
): {
  totalFees: BigNumber;
  sentValue: BigNumber;
  value: BigNumber;
  balanceChange: BigNumber;
} => {
  const value = new BigNumber(traceTree.msg.value || 0);
  const totalFees = new BigNumber(traceTree.msg.dst_transaction?.total_fees || 0)
    .plus(traceTree.msg.dst_transaction?.action?.total_fwd_fees || 0)
    .minus(traceTree.msg.dst_transaction?.action?.total_action_fees || 0);
  const sentValue = traceTree.outTraces.reduce((acc, next) => acc.plus(next.msg.value || 0), new BigNumber(0));

  return {
    value,
    totalFees,
    sentValue,
    balanceChange: value.minus(totalFees).minus(sentValue),
  };
};
export const mapParams = (
  obj: Record<any, any> | Array<any> | undefined,
  contracts: Array<ContractWithName | undefined>,
  isFullPrint?: boolean,
): Record<any, any> => {
  if (Array.isArray(obj)) {
    return obj.map(mapRules(contracts, isFullPrint));
  }
  return _(obj).mapValues(mapRules(contracts, isFullPrint)).value();
};
const mapRules = (contracts: Array<ContractWithName | undefined>, isFullPrint?: boolean) => (value: any) => {
  if (value instanceof Address) {
    const contractName = contracts?.filter(isT).find(contract => contract.contract.address.equals(value))?.name;
    const contractAddress = isFullPrint
      ? value.toString()
      : value.toString().slice(0, 5) + "..." + value.toString().slice(-5);
    return contractName ? `${contractName}(${contractAddress})` : contractAddress;
  }
  if (typeof value === "string" && value.length >= 20 && !isFullPrint) {
    return value.slice(0, 4) + "..." + value.slice(-4);
  }
  if (Array.isArray(value)) {
    return mapParams(value, contracts);
  }
  if (typeof value === "object") {
    return mapParams(value, contracts);
  }

  return value;
};
