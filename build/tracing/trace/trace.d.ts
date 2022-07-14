import { AllowedCodes, MsgTree, TraceType } from "../types";
import { Address } from "everscale-inpage-provider";
import { AbiFunctionName } from "everscale-inpage-provider/dist/models";
import { DecodedInput } from "everscale-inpage-provider/dist/contract";
import { ContractWithName } from "../../types";
import { TracingInternal } from "../tracingInternal";
export declare class Trace<Abi = any> {
    private readonly tracing;
    readonly msg: MsgTree;
    private readonly srcTrace;
    outTraces: Array<any>;
    error: any;
    type: TraceType | null;
    contract: ContractWithName;
    decodedMsg: DecodedInput<Abi, AbiFunctionName<Abi>> | undefined;
    hasErrorInTree: boolean;
    constructor(tracing: TracingInternal, msg: MsgTree, srcTrace?: any);
    buildTree(allowedCodes: AllowedCodes | undefined, contractGetter: (codeHash: string, address: Address) => ContractWithName<Abi> | undefined): Promise<void>;
    checkForErrors(allowedCodes?: AllowedCodes): void;
    decodeMsg(contract?: ContractWithName | null): Promise<void>;
    decode(contract: ContractWithName<Abi> | undefined): Promise<void>;
    setMsgType(): void;
}
