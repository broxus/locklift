import {
  Addressable,
  BalanceChangeInfoStorage,
  ErrorStore,
  MsgError,
  TraceType,
  ViewTrace,
  ViewTraceTree,
  ViewTraceTreeWithTotalFee,
} from "../types";
import _ from "lodash";

import { Address, Contract, DecodedEventWithTransaction } from "everscale-inpage-provider";
import { AbiEventName } from "everscale-inpage-provider/dist/models";
import { extractAddress, extractStringAddress, fetchAccounts, isT } from "../utils";
import { ContractWithName } from "../../../types";
import {
  applyTotalFees,
  calculateTotalFees,
  getBalanceChangingInfo,
  getBalanceDiff,
  getErrorsInfo,
  printer,
} from "./utils";
import { Tokens } from "./tokens";
import { pipe } from "rxjs";

type NameAndType<T extends string = string> = { type: TraceType; name: T; contract?: Addressable };
type EventNames<Abi> = DecodedEventWithTransaction<Abi, AbiEventName<Abi>>["event"];

type EventsNamesInner<T extends Contract<any>> = EventNames<T extends Contract<infer f> ? f : never>;

//@ts-ignore
type MethodParams<C extends Contract<any>, N extends keyof C["methods"]> = Parameters<C["methods"][N]>[0];
type EventParams<Abi, N extends string> = Extract<
  DecodedEventWithTransaction<Abi, AbiEventName<Abi>>,
  { event: N }
>["data"];
export class ViewTracingTree {
  readonly viewTraceTree: ViewTraceTreeWithTotalFee;
  readonly tokens: Tokens;
  balanceChangeInfo: BalanceChangeInfoStorage;
  msgErrorsStore: ErrorStore;
  constructor(
    viewTraceTree: ViewTraceTree,
    private readonly contractGetter: (codeHash: string, address: Address) => ContractWithName<any> | undefined,
    private readonly endpoint: string,
  ) {
    this.viewTraceTree = applyTotalFees(_.cloneDeep(viewTraceTree));
    this.balanceChangeInfo = pipe(getBalanceChangingInfo, getBalanceDiff)(this.viewTraceTree);

    this.msgErrorsStore = getErrorsInfo(this.viewTraceTree);
    this.tokens = new Tokens(this.viewTraceTree);
  }
  getErrorsByContract = <T extends Contract<any> | Address | string>(contract: T): Array<MsgError> => {
    return this.msgErrorsStore[extractStringAddress(contract)];
  };
  getAllErrors = () =>
    Object.entries(this.msgErrorsStore).flatMap(([key, errors]) => errors.map(error => ({ contract: key, ...error })));

  getBalanceDiff = <T extends Contract<any> | Address | string>(
    contracts: T[] | T,
  ): T extends T[] ? Record<string, string> : string => {
    if (Array.isArray(contracts)) {
      return contracts.reduce((acc, contract) => {
        const address = extractStringAddress(contract);
        return { ...acc, [address as string]: this.balanceChangeInfo[address.toString()]?.balanceDiff.toString() };
      }, {} as Record<string, string>) as T extends T[] ? Record<string, string> : string;
    }
    const address = extractStringAddress(contracts);
    return this.balanceChangeInfo[address].balanceDiff.toString() as T extends T[] ? Record<string, string> : string;
  };

  findCallsForContract = <C extends Contract<any>, N extends keyof C["methods"] & string>({
    contract,
    name,
  }: { contract: C } & { name: N }) => {
    return this.findForContract({ contract, name })
      .map(el => el?.params)
      .filter(isT);
  };

  findEventsForContract = <
    C extends Contract<any>,
    Abi extends C extends Contract<infer f> ? f : never,
    N extends EventNames<Abi>,
  >({
    contract,
    name,
  }: { contract: C } & { name: N }) =>
    this.findForContract({ name, contract })
      .map(el => el?.params)
      .filter(isT);

  private findForContract = <
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
      return this.findByType<N, MethodParams<C, N>>({ name, type: TraceType.FUNCTION_CALL, contract });
    }
    return this.findByType<N, E>({ name, type: TraceType.EVENT, contract });
  };

  findByType = <M extends string, P>(params: NameAndType): Array<ViewTrace<M, P>["decodedMsg"]> =>
    this._findByType<M, P>(params, [this.viewTraceTree]).map(el => el.decodedMsg);

  findByTypeWithFullData = <M extends string, P>(params: NameAndType) =>
    this._findByType<M, P>(params, [this.viewTraceTree]);

  private _findByType = <M extends string, P>(
    { type, name, contract }: NameAndType,
    tree: Array<ViewTraceTree>,
  ): Array<ViewTrace<M, P>> => {
    if (tree.length === 0) {
      return [];
    }
    const matchedMethods: Array<ViewTrace<M, P>> = [];
    for (const trace of tree) {
      if (
        type === trace.type &&
        name === trace.decodedMsg?.method &&
        (contract ? extractAddress(contract).equals(extractAddress(trace.contract.contract)) : true)
      ) {
        matchedMethods.push(trace as any);
      }
      if (trace.outTraces.length > 0) {
        return [...matchedMethods, ...this._findByType<M, P>({ name, type, contract }, trace.outTraces)];
      }
    }
    return matchedMethods;
  };
  totalGasUsed = () => calculateTotalFees(this.viewTraceTree).toNumber();

  beautyPrint = async (): Promise<void> => {
    const result = _(extractAllAddresses(this.viewTraceTree)).uniq().value();
    const contracts = (await fetchAccounts(result, this.endpoint)).map(({ code_hash: codeHash, id }) =>
      this.contractGetter(codeHash, new Address(id)),
    );

    console.log(
      printer(this.viewTraceTree, {
        contracts,
      }) +
        "\n" +
        this._beautyPrint(this.viewTraceTree, 0, contracts),
    );
  };

  private _beautyPrint = (
    viewTrace: ViewTraceTreeWithTotalFee,
    offset: number,
    contracts: Array<ContractWithName | undefined>,
  ): string => {
    let traces = "";

    for (const viewTraceInt of viewTrace.outTraces) {
      traces =
        traces +
        `${Array(offset).fill("  ").join("")} ${printer(viewTraceInt, {
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
