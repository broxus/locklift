import { AllowErrorCodes, DecodedMsg, MessageTree, TraceContext, TraceType } from "../types";
import { ContractWithArtifacts } from "../../../types";
import { AbiEventName, AbiFunctionName } from "everscale-inpage-provider";
import { MessageType } from "nekoton-wasm";

enum TargetType {
  DST = "DST",
  SRC = "SRC",
  DEPLOY = "DEPLOY",
}

const getCodeAndAddress = (
  msg: MessageTree,
  targetType: TargetType,
  ctx: TraceContext,
): { codeHash: string | undefined; address: string } => {
  switch (targetType) {
    case TargetType.DST:
      return {
        address: msg.dst as string,
        codeHash: ctx.accounts[msg.dst as string]?.codeHash,
      };
    case TargetType.SRC:
      return {
        address: msg.src as string,
        codeHash: ctx.accounts[msg.src as string]?.codeHash,
      };
    case TargetType.DEPLOY:
      return {
        codeHash: msg.init?.codeHash,
        address: msg.dst as string,
      };
  }
};

export const decoder = async <Abi>({
  msgBody,
  msgType,
  contract,
  initialType,
}: {
  contract: ContractWithArtifacts<Abi>;
  msgBody: string;
  msgType: MessageType;
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
    case "IntMsg":
    case "ExtIn": {
      const isInternal = msgType === "IntMsg";
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
    case "ExtOut": {
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

export const contractInformation = ({
  msg,
  type,
  ctx,
}: {
  msg: MessageTree;
  type: TraceType;
  ctx: TraceContext;
}): { codeHash?: string; address: string } =>
  ({
    [TraceType.DEPLOY]: getCodeAndAddress(msg, TargetType.DEPLOY, ctx),
    [TraceType.FUNCTION_CALL]: getCodeAndAddress(msg, TargetType.DST, ctx),
    [TraceType.EVENT]: getCodeAndAddress(msg, TargetType.SRC, ctx),
    [TraceType.EVENT_OR_FUNCTION_RETURN]: getCodeAndAddress(msg, TargetType.SRC, ctx),
    [TraceType.BOUNCE]: getCodeAndAddress(msg, TargetType.DST, ctx),

    //TODO
    [TraceType.FUNCTION_RETURN]: getCodeAndAddress(msg, TargetType.SRC, ctx),
    [TraceType.TRANSFER]: getCodeAndAddress(msg, TargetType.DST, ctx),
  }[type]);

export const isErrorExistsInAllowedArr = (
  allowedArr: Array<AllowErrorCodes> | undefined,
  code: AllowErrorCodes,
): boolean => !!allowedArr?.some(el => el === code);
