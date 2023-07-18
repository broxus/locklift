import {
  AbiEventName,
  AbiFunctionName,
  Address,
  Contract,
  DecodedEvent,
  DecodedInput,
  DecodedOutput,
  ProviderRpcClient,
  TransactionWithAccount,
} from "everscale-inpage-provider";

import { Trace } from "./trace/trace";
import { Optional } from "../../types";
import BigNumber from "bignumber.js";
import { JsRawMessage, JsRawTransaction } from "nekoton-wasm";

export enum TraceType {
  FUNCTION_CALL = "function_call",
  FUNCTION_RETURN = "function_return",
  DEPLOY = "deploy",
  EVENT = "event",
  EVENT_OR_FUNCTION_RETURN = "event_or_return",
  BOUNCE = "bounce",
  TRANSFER = "transfer",
}

export type TruncatedTransaction = Omit<JsRawTransaction, "description" | "inMessage" | "outMessages"> &
  JsRawTransaction["description"];

export type MessageTree = JsRawMessage & {
  dstTransaction: TruncatedTransaction | undefined;
  outMessages: Array<MessageTree>;
};

export type AccountData = {
  codeHash: string | undefined;
  id: string;
};

export type TransactionWithAccountAndBoc = TransactionWithAccount & { boc: string };

export type RevertedBranch<Abi = unknown> = { totalActions: number; traceLog: Trace<Abi>; actionIdx: number };
export type WaitFinalizedOutput<T> = {
  extTransaction: T;
  transactions: Array<TransactionWithAccountAndBoc>;
};
export type TraceParams<T> = {
  finalizedTx: WaitFinalizedOutput<T>;
  allowedCodes?: AllowedCodes;
  raise?: boolean;
};

export type TraceContext = {
  accounts: { [key: string]: AccountData };
};

export type AllowErrorCodes = number | null;
export type OptionalContracts = Optional<AllowedCodes, "contracts">;
type AllowedCode = {
  compute?: Array<AllowErrorCodes>;
  action?: Array<AllowErrorCodes>;
};
export type AllowedCodes = AllowedCode & {
  contracts?: Record<string, AllowedCode>;
};

export type DecoderOutput<Abi> =
  | DecodedOutput<Abi, AbiFunctionName<Abi>>
  | DecodedInput<Abi, AbiFunctionName<Abi>>
  | DecodedEvent<Abi, AbiEventName<Abi>>
  | undefined;

export interface TracingTransportConnection {
  provider: ProviderRpcClient;
  getAccountData(address: Address): Promise<AccountData>;
  getAccountsData(accounts: Address[]): Promise<AccountData[]>;
}

export type DecodedMsg<M extends string = string, P extends Record<string, any> | any = Record<string, any>> = {
  method?: M;
  params?: P;
};
export type ViewTrace<M extends string = string, P extends Record<string, any> | any = Record<string, any>> = Pick<
  Trace,
  "msg" | "type" | "contract" | "error"
> & { decodedMsg: DecodedMsg<M, P> | undefined };
export type ViewTraceTree<M extends string = string, P extends Record<string, any> = Record<string, any>> = ViewTrace<
  M,
  P
> & { outTraces: Array<ViewTraceTree<M, P>> };
export enum InteractionType {
  EVENT,
  FUNCTION_CALL,
}

export type ViewTraceTreeWithTotalFee = Omit<ViewTraceTree, "outTraces"> & {
  totalFees: BigNumber;
  sentValue: BigNumber;
  value: BigNumber;
  balanceChange: BigNumber;
  outTraces: Array<ViewTraceTreeWithTotalFee>;
};

export type BalanceChangingInfo = {
  balanceDiff: BigNumber;
};

export type BalanceChangeInfoStorage = Record<string, BalanceChangingInfo>;
export type ErrorStore = Record<string, Array<MsgError>>;
export type MsgError = {
  phase: "compute" | "action";
  code: number | null;
  trace: ViewTrace;
};
export type Addressable = Contract<any> | Address | string;
export type LabelsMap = Map<string, string>;
