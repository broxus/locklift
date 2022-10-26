import { AllowErrorCodes, DecodedMsg, MsgTree, TraceType } from "../types";
import { ContractWithName } from "../../../types";
import { AbiEventName, AbiFunctionName } from "everscale-inpage-provider/dist/models";

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

export const decoder = async <Abi>({
  msgBody,
  msgType,
  contract,
  initialType,
}: {
  contract: ContractWithName<Abi>;
  msgBody: string;
  msgType: 0 | 1 | 2;
  initialType: TraceType | null;
}): Promise<{
  decoded: DecodedMsg;
  finalType: TraceType | null;
}> => {
  const parsedAbi = JSON.parse(contract.contract.abi) as {
    functions: Array<{ name: AbiFunctionName<Abi> }>;
    events: Array<{ name: AbiEventName<Abi> }>;
  };
  switch (msgType) {
    case 0:
    case 1: {
      const isInternal = msgType === 0;
      return {
        decoded: await contract.contract
          .decodeInputMessage({
            internal: isInternal,
            body: msgBody,
            methods: parsedAbi.functions.map(el => el.name),
          })
          .then(decoded => ({ method: decoded?.method, params: decoded?.input })),
        finalType: initialType,
      };
    }
    case 2: {
      const outMsg = await contract.contract.decodeOutputMessage({
        body: msgBody,
        methods: parsedAbi.functions.map(el => el.name),
      });
      if (outMsg) {
        return {
          decoded: outMsg,
          finalType: TraceType.FUNCTION_RETURN,
        };
      }
      return {
        decoded: await contract.contract
          .decodeEvent({
            body: msgBody,
            events: parsedAbi.events.map(el => el.name),
          })
          .then(decoded => ({ params: decoded?.data, method: decoded?.event })),
        finalType: TraceType.EVENT,
      };
    }
  }
};

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

export const isErrorExistsInAllowedArr = (
  allowedArr: Array<AllowErrorCodes> | undefined,
  code: AllowErrorCodes,
): boolean => !!allowedArr?.some(el => el === code);
