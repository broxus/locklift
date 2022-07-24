import { DecodedEvent, DecodedOutput } from "everscale-inpage-provider";
import { AbiEventName, AbiFunctionName } from "everscale-inpage-provider/dist/models";
import { DecodedInput } from "everscale-inpage-provider/dist/contract";

import { Trace } from "./trace/trace";
import { Optional } from "../types";

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
  dst_transaction: any;
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

export type RevertedBranch<Abi = unknown> = { totalActions: number; traceLog: Trace<Abi>; actionIdx: number };
export type TraceParams = {
  inMsgId: string;
  allowedCodes?: AllowedCodes;
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

export type DecodedMsg = {
  method?: string;
  params?: Record<string, any>;
};
