import { DecodedMsg, MsgTree, TraceType } from "../types";
import { ContractWithName } from "../../types";
export declare const decoder: <Abi>({ msgBody, msgType, contract, initialType, }: {
    contract: ContractWithName<Abi>;
    msgBody: string;
    msgType: 0 | 1 | 2;
    initialType: TraceType | null;
}) => Promise<{
    decoded: DecodedMsg;
    finalType: TraceType | null;
}>;
export declare const contractContractInformation: ({ msg, type, }: {
    msg: MsgTree;
    type: TraceType;
}) => {
    codeHash?: string;
    address: string;
};
