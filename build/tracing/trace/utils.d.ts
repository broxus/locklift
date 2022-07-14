import { MsgTree, TraceType } from "../types";
export declare const contractContractInformation: ({ msg, type, }: {
    msg: MsgTree;
    type: TraceType;
}) => {
    codeHash?: string;
    address: string;
};
