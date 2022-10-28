import { Address, Contract, DecodedEvent, DecodedOutput } from "everscale-inpage-provider";
import { AbiEventName, AbiFunctionName } from "everscale-inpage-provider/dist/models";
import { DecodedInput } from "everscale-inpage-provider/dist/contract";

import { Trace } from "./trace/trace";
import { Optional } from "../../types";
import BigNumber from "bignumber.js";

export enum TraceType {
  FUNCTION_CALL = "function_call",
  FUNCTION_RETURN = "function_return",
  DEPLOY = "deploy",
  EVENT = "event",
  EVENT_OR_FUNCTION_RETURN = "event_or_return",
  BOUNCE = "bounce",
  TRANSFER = "transfer",
}

export type MsgTree = {
  outMessages: Array<any>;
  dst_transaction: any & {
    total_fees: string;
    action: {
      total_fwd_fees: string;
      total_action_fees: string;
    };
  };
  dst: string;
  msg_type: 0 | 1 | 2;
  body: string;
  bounce: boolean;
  bounced: boolean;
  code_hash: string;
  src: string;
  value: number;
  id: string;
  dst_account?: {
    id: string;
    code_hash: string;
  };
  src_account?: {
    id: string;
    code_hash: string;
  };
};

export type AccountData = {
  code_hash: string;
  id: string;
};

export type RevertedBranch<Abi = unknown> = { totalActions: number; traceLog: Trace<Abi>; actionIdx: number };
export type TraceParams = {
  inMsgId: string;
  allowedCodes?: AllowedCodes;
  rise?: boolean;
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
  code: number;
  trace: ViewTrace;
};
export type Addressable = Contract<any> | Address | string;
