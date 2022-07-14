import { MsgTree, TraceType } from "../types";
enum TargetType {
  DST = "DST",
  SRC = "SRC",
  DEPLOY = "DEPLOY",
}
const getCodeAndAddress = (msg: MsgTree, targetType: TargetType): { codeHash: string | undefined; address: string } => {
  switch (targetType) {
    case TargetType.DST:
      return {
        address: msg.dst,
        codeHash: msg.dst_account?.code_hash,
      };
    case TargetType.SRC:
      return {
        address: msg.src,
        codeHash: msg.src_account?.code_hash,
      };
    case TargetType.DEPLOY:
      return {
        codeHash: msg.code_hash,
        address: msg.dst,
      };
  }
};
//
export const contractContractInformation = ({
  msg,
  type,
}: {
  msg: MsgTree;
  type: TraceType;
}): { codeHash?: string; address: string } =>
  ({
    [TraceType.DEPLOY]: getCodeAndAddress(msg, TargetType.DEPLOY),
    [TraceType.FUNCTION_CALL]: getCodeAndAddress(msg, TargetType.DST),
    [TraceType.EVENT]: getCodeAndAddress(msg, TargetType.SRC),
    [TraceType.EVENT_OR_FUNCTION_RETURN]: getCodeAndAddress(msg, TargetType.SRC),
    [TraceType.BOUNCE]: getCodeAndAddress(msg, TargetType.DST),

    //TODO
    [TraceType.FUNCTION_RETURN]: getCodeAndAddress(msg, TargetType.SRC),
    [TraceType.TRANSFER]: getCodeAndAddress(msg, TargetType.DST),
  }[type]);
