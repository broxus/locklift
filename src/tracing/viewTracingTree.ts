import { TraceType, ViewTrace, ViewTraceTree } from "./types";
import chalk from "chalk";
import _ from "lodash";
import { Address, Contract, DecodedEventWithTransaction } from "everscale-inpage-provider";
import { AbiEventName } from "everscale-inpage-provider/dist/models";
import { convert, fetchAccounts, isT } from "./utils";
import { ContractWithName } from "../types";

type NameAndType<T extends string = string> = { type: TraceType; name: T };
type EventNames<
  T extends Contract<any>,
  Abi extends T extends Contract<infer f> ? f : never,
> = DecodedEventWithTransaction<Abi, AbiEventName<Abi>>["event"];

type EventsNamesInner<T extends Contract<any>> = EventNames<T, T extends Contract<infer f> ? f : never>;
// type ExtractEvent<T extends VaultEvents> = Extract<
//   DecodedEventWithTransaction<StEverVaultAbi, AbiEventName<StEverVaultAbi>>,
//   { event: T }
// >;
//@ts-ignore
type MethodParams<C extends Contract<any>, N extends keyof C["methods"]> = Parameters<C["methods"][N]>[0];
type EventParams<Abi, N extends string> = Extract<
  DecodedEventWithTransaction<Abi, AbiEventName<Abi>>,
  { event: N }
>["data"];
export class ViewTracingTree {
  private readonly viewTraceTree: ViewTraceTree;
  constructor(
    viewTraceTree: ViewTraceTree,
    private readonly contractGetter: (codeHash: string, address: Address) => ContractWithName<any> | undefined,
    private readonly endpoint: string,
  ) {
    this.viewTraceTree = _.cloneDeep(viewTraceTree);
  }
  findForContract = <
    C extends Contract<any>,
    N extends (keyof C["methods"] & string) | EventsNamesInner<C>,
    Abi extends C extends Contract<infer f> ? f : never,
    E extends N extends keyof C["methods"] & string ? MethodParams<C, N> : EventParams<Abi, N>,
  >({
    contract,
    name,
  }: { contract: C } & { name: N }) => {
    //@ts-ignore
    if (name in contract._functions) {
      return this.findByType<N, MethodParams<C, N>>({ name, type: TraceType.FUNCTION_CALL });
    }
    return this.findByType<N, E>({ name, type: TraceType.EVENT });
  };
  findByType = <M extends string, P>(params: NameAndType) => this._findByType<M, P>(params, [this.viewTraceTree]);
  _findByType = <M extends string, P>(
    { type, name }: NameAndType,
    tree: Array<ViewTraceTree>,
  ): Array<ViewTrace<M, P>> => {
    if (tree.length === 0) {
      return [];
    }
    const matchedMethods: Array<ViewTrace<M, P>> = [];
    for (const trace of tree) {
      if (type === trace.type && name === trace.decodedMsg?.method) {
        matchedMethods.push(trace as any);
      }
      if (trace.outTraces.length > 0) {
        return [...matchedMethods, ...this._findByType<M, P>({ name, type }, trace.outTraces)];
      }
    }
    return matchedMethods;
  };
  beautyPrint = async () => {
    const result = _(extractAllAddresses(this.viewTraceTree)).uniq().value();
    const contracts = (await fetchAccounts(result, this.endpoint)).map(({ code_hash: codeHash, id }) =>
      this.contractGetter(codeHash, new Address(id)),
    );

    return (
      printer(this.viewTraceTree, {
        valueSent: this.viewTraceTree.outTraces.reduce((acc, next) => acc + Number(convert(next.msg.value)), 0),
        contracts,
      }) +
      "\n" +
      this._beautyPrint(this.viewTraceTree, 0, contracts)
    );
  };

  _beautyPrint = (viewTrace: ViewTraceTree, offset: number, contracts: Array<ContractWithName | undefined>): string => {
    let traces = "";

    for (const viewTraceInt of viewTrace.outTraces) {
      traces =
        traces +
        `${Array(offset).fill(" ").join("")} ${printer(viewTraceInt, {
          valueSent: viewTraceInt.outTraces.reduce((acc, next) => acc + Number(convert(next.msg.value)), 0),
          contracts,
        })}\n${this._beautyPrint(viewTraceInt, offset + 1, contracts)}`;
    }
    return traces;
  };
}

const extractAllAddresses = (viewTrace: ViewTraceTree): Array<Address> => {
  const addresses: Array<Address> = extractAddressFromObject(viewTrace.decodedMsg || {});
  return viewTrace.outTraces.reduce((acc, next) => {
    return [...acc, ...extractAllAddresses(next)];
  }, addresses);
};

const extractAddressFromObject = (obj: Record<any, any>): Array<Address> => {
  return Object.values(obj).reduce((acc, value) => {
    if (value instanceof Address) {
      return [...acc, value.toString()];
    }
    if (typeof value === "object") {
      return [...acc, ...extractAddressFromObject(value)];
    }

    return acc;
  }, [] as Array<Address>);
};

const replaceAddressToContracts = (
  obj: Record<any, any> | Array<any> | undefined,
  contracts: Array<ContractWithName | undefined>,
): Record<any, any> => {
  if (Array.isArray(obj)) {
    return obj.map(mapRules(contracts));
  }
  return _(obj).mapValues(mapRules(contracts)).value();
};

const mapRules = (contracts: Array<ContractWithName | undefined>) => (value: any) => {
  if (value instanceof Address) {
    const contractName = contracts?.filter(isT).find(contract => contract.contract.address.equals(value))?.name;
    const contractAddress = value.toString().slice(0, 5) + "..." + value.toString().slice(-5);
    return contractName ? `${contractName}(${contractAddress})` : contractAddress;
  }
  if (typeof value === "string" && value.length >= 20) {
    return value.slice(0, 5) + "..." + value.slice(-5);
  }
  if (Array.isArray(value)) {
    return replaceAddressToContracts(value, contracts);
  }
  if (typeof value === "object") {
    return replaceAddressToContracts(value, contracts);
  }

  return value;
};

const printer = (
  { type, decodedMsg, msg, contract }: Pick<ViewTraceTree, "type" | "decodedMsg" | "msg" | "contract">,
  { valueSent, contracts }: { valueSent: number; contracts: Array<ContractWithName | undefined> },
): string => {
  const valueReceive = convert(msg.value);
  const diff = (Number(valueReceive) - valueSent).toPrecision(3);
  const valueParams = `{valueReceive: ${valueReceive},valueSent: ${valueSent}, rest: ${diff}${
    Number(diff) < 0 ? chalk.red("⮯") : chalk.green("⮬")
  }}`;
  const header = `${type && mapType[type]} ${colors.contractName(contract.name)}.${colors.methodName(
    decodedMsg?.method,
  )}${type === TraceType.EVENT ? "" : valueParams}`;
  return `${header}(${Object.entries(replaceAddressToContracts(decodedMsg?.params, contracts))
    .map(([key, value]) => `${colors.paramsKey(key)}=${JSON.stringify(value)}, `)
    .join("")
    .split(", ")
    .slice(0, -1)
    .join(", ")})`;
};

const mapType: Record<TraceType, string> = {
  [TraceType.BOUNCE]: "BONCE",
  [TraceType.DEPLOY]: "DEPLOY",
  [TraceType.EVENT]: "EVENT",
  [TraceType.EVENT_OR_FUNCTION_RETURN]: "EVENT_OR_RETURN",
  [TraceType.FUNCTION_CALL]: "CALL",
  [TraceType.FUNCTION_RETURN]: "RETURN",
  [TraceType.TRANSFER]: "TRANSFER",
};

const colors: Record<"contractName" | "methodName" | "paramsKey", (param?: string) => string> = {
  contractName: chalk.cyan,
  methodName: chalk.blueBright,
  paramsKey: chalk.magenta,
};
