import { TraceType, ViewTrace, ViewTraceTree } from "./types";
import _ from "lodash";
import { Contract, DecodedEventWithTransaction } from "everscale-inpage-provider";
import { AbiEventName } from "everscale-inpage-provider/dist/models";

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
  constructor(viewTraceTree: ViewTraceTree) {
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
}
