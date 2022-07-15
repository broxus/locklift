import { MsgTree, RevertedBranch } from "./types";
export declare const fetchMsgData: (msgId: string, endpoint: string) => Promise<MsgTree>;
export declare const convert: (number: number, decimals?: number, precision?: number) => string | null;
export declare const throwErrorInConsole: <Abi>(revertedBranch: RevertedBranch<Abi>[]) => void;
