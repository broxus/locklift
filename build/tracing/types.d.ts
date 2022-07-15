import { DecodedEvent, DecodedOutput } from "everscale-inpage-provider";
import { AbiEventName, AbiFunctionName } from "everscale-inpage-provider/dist/models";
import { DecodedInput } from "everscale-inpage-provider/dist/contract";
import { Trace } from "./trace/trace";
import { Optional } from "../types";
export declare enum TraceType {
    FUNCTION_CALL = "function_call",
    FUNCTION_RETURN = "function_return",
    DEPLOY = "deploy",
    EVENT = "event",
    EVENT_OR_FUNCTION_RETURN = "event_or_return",
    BOUNCE = "bounce",
    TRANSFER = "transfer"
}
export declare type MsgTree = {
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
export declare type RevertedBranch<Abi = unknown> = {
    totalActions: number;
    traceLog: Trace<Abi>;
    actionIdx: number;
};
export declare type TraceParams = {
    inMsgId: string;
    allowedCodes?: AllowedCodes;
};
export declare type OptionalContracts = Optional<AllowedCodes, "contracts">;
declare type AllowedCode = {
    compute: Array<number | null>;
    action: Array<number | null>;
};
export declare type AllowedCodes = AllowedCode & {
    contracts: Record<string, AllowedCode>;
};
export declare type DecoderOutput<Abi> = DecodedOutput<Abi, AbiFunctionName<Abi>> | DecodedInput<Abi, AbiFunctionName<Abi>> | DecodedEvent<Abi, AbiEventName<Abi>> | undefined;
export declare type DecodedMsg = {
    method?: string;
    params?: Record<string, any>;
};
export {};
