import { Address } from "everscale-inpage-provider";
import _ from "lodash";
import { ViewTracingTree } from "../../internal/tracing/viewTraceTree/viewTracingTree";
import { Addressable, TraceType } from "../../internal/tracing/types";
import { extractAddress } from "../../internal/tracing/utils";

export const getMessage = ({
  viewTracingTree,
  contract,
  msgType,
  msgName,
}: {
  viewTracingTree: ViewTracingTree;
  contract?: Addressable;
  msgName: string;
  msgType: TraceType;
}) => {
  return viewTracingTree
    .findByTypeWithFullData({ type: msgType, name: msgName })
    .filter(event => event.decodedMsg?.method === msgName)
    .filter(event => {
      if (!contract) {
        return true;
      }
      return contract instanceof Address
        ? event.contract.contract.address.equals(contract)
        : extractAddress(contract).equals(event.contract.contract.address);
    });
};
export const mapAddressesToString = (obj: Record<any, any> | Array<any>): Record<any, any> => {
  const mapFn = (value: any) => {
    if (Array.isArray(value)) {
      return mapAddressesToString(value);
    }
    if (value instanceof Address) {
      return value.toString();
    }
    if (typeof value === "object") {
      return mapAddressesToString(value);
    }
    return value;
  };
  if (Array.isArray(obj)) {
    return obj.map(mapFn);
  }
  return _(obj).mapValues(mapFn).value();
};

export const objectIntersection = (
  rootObject: Record<string, any> | Array<any>,
  partialObject: Record<any, any> | Array<any> | undefined,
): Record<string, any> => {
  if (!rootObject || !partialObject) {
    return rootObject;
  }

  if (Array.isArray(rootObject) && Array.isArray(partialObject)) {
    return rootObject
      .filter((_, idx) => !!partialObject[idx])
      .map((value, idx) => (typeof value === "object" ? objectIntersection(value, partialObject[idx]) : value));
  }

  if (!Array.isArray(rootObject) && !Array.isArray(partialObject)) {
    return Object.entries(rootObject).reduce(
      (acc, [key, value]) =>
        key in partialObject
          ? {
              ...acc,
              [key]: typeof value === "object" ? objectIntersection(value, partialObject[key]) : value,
            }
          : acc,
      {},
    );
  }
  return rootObject;
};
