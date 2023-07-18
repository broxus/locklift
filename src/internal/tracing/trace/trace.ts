import { CONSOLE_ADDRESS } from "../constants";
import { AllowedCodes, DecodedMsg, MessageTree, TraceContext, TraceType } from "../types";
import { Address } from "everscale-inpage-provider";

import { ContractWithArtifacts } from "../../../types";
import { contractInformation, decoder, isErrorExistsInAllowedArr } from "./utils";
import { TracingInternal } from "../tracingInternal";
import * as nt from "nekoton-wasm";

export class Trace<Abi = any> {
  outTraces: Array<Trace> = [];
  error: null | {
    phase: "compute" | "action";
    code: number | null;
    ignored?: boolean;
    reason: nt.TrComputeSkippedReason | undefined;
  } = null;
  transactionTrace: nt.EngineTraceInfo[] | undefined = undefined;

  type: TraceType | null = null;
  contract!: ContractWithArtifacts;
  decodedMsg: DecodedMsg | undefined = undefined;
  hasErrorInTree = false;

  constructor(
    private readonly tracing: TracingInternal,
    readonly msg: MessageTree,
    private readonly srcTrace: Trace | null,
    private readonly context: TraceContext,
  ) {}

  async buildTree(
    allowedCodes: AllowedCodes = { compute: [], action: [], contracts: { any: { compute: [], action: [] } } },
  ) {
    this.setMsgType();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { codeHash, address } = contractInformation({ msg: this.msg, type: this.type!, ctx: this.context });
    const contract = this.tracing.factory.getContractByCodeHashOrDefault(codeHash || "", new Address(address));

    this.checkForErrors(allowedCodes);
    if (this.error && !this.error.ignored && this.msg.dstTransaction) {
      this.transactionTrace = this.tracing.network.getTxTrace(this.msg.dstTransaction.hash);
    }

    await this.decode(contract);
    for (const msg of this.msg.outMessages) {
      const trace = new Trace(this.tracing, msg, this, this.context);
      await trace.buildTree(allowedCodes);
      if (trace.hasErrorInTree) {
        this.hasErrorInTree = true;
      }
      this.outTraces.push(trace);
    }
  }

  // allowed_codes - {compute: [100, 50, 12], action: [11, 12]}
  checkForErrors(
    allowedCodes: AllowedCodes = { compute: [], action: [], contracts: { any: { compute: [], action: [] } } },
  ) {
    const tx = this.msg.dstTransaction;

    if (this.msg.dst === CONSOLE_ADDRESS) {
      return;
    }

    let skipComputeCheck = false;
    if (tx && tx.compute.status === "vm" && tx.compute.success) {
      skipComputeCheck = true;
    }
    let skipActionCheck = false;
    if (tx && tx.action && tx.action.success) {
      skipActionCheck = true;
    }
    // error occured during compute phase
    if (!skipComputeCheck && tx) {
      if (tx.compute.status === "skipped") {
        this.error = { phase: "compute", code: null, reason: tx.compute.reason };
      } else {
        this.error = { phase: "compute", code: tx.compute.exitCode, reason: undefined };
      }
      // we didn't expect this error, save error
      if (
        isErrorExistsInAllowedArr(allowedCodes.compute, this.error.code) ||
        isErrorExistsInAllowedArr(allowedCodes.contracts?.[this.msg.dst as string]?.compute, this.error.code)
      ) {
        this.error.ignored = true;
      }
    } else if (!skipActionCheck && tx && tx.action && tx.action.resultCode !== 0) {
      this.error = { phase: "action", code: tx.action.resultCode, reason: undefined };
      // we didn't expect this error, save error
      if (
        isErrorExistsInAllowedArr(allowedCodes.action, tx.action.resultCode) ||
        isErrorExistsInAllowedArr(allowedCodes.contracts?.[this.msg.dst as string]?.action, tx.action.resultCode)
      ) {
        this.error.ignored = true;
      }
    }
    if (this.error && !this.error.ignored) {
      this.hasErrorInTree = true;
    }
  }

  async decodeMsg(contract: ContractWithArtifacts | null = null): Promise<
    | {
        decoded: DecodedMsg;
        finalType: TraceType | null;
      }
    | undefined
  > {
    if (contract === null) {
      contract = this.contract;
    }

    if (this.msg.dst === CONSOLE_ADDRESS) {
      return;
    }

    if (this.type === TraceType.TRANSFER || this.type === TraceType.BOUNCE) {
      return;
    }

    if (this.type === TraceType.FUNCTION_CALL && this.srcTrace) {
      // this is responsible callback with answerId = 0, we cant decode it, however contract doesnt need it too
      // TODO: check
      // @ts-ignore
      if (this.srcTrace.decodedMsg && this.srcTrace.decodedMsg.value?.answerId === "0") {
        return;
      }
    }

    // function call, but we dont have contract here => we cant decode msg
    if (this.type === TraceType.FUNCTION_CALL && !contract) {
      return;
    }

    // 60 error on compute phase - wrong function id. We cant decode this msg with contract abi
    if (this.error && this.error.phase === "compute" && this.error.code === 60) {
      return;
    }

    if (!contract) {
      return;
    }

    return await decoder({
      msgBody: this.msg.body as string,
      msgType: this.msg.msgType,
      contract,
      initialType: this.type,
    });
  }

  async decode(contract: ContractWithArtifacts<Abi> | undefined) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.contract = contract!;
    const decoded = await this.decodeMsg(contract);
    if (decoded) {
      this.type = decoded.finalType;
      this.decodedMsg = decoded.decoded;
    }
  }

  setMsgType() {
    switch (this.msg.msgType) {
      // internal - deploy or function call or bound or transfer
      case "IntMsg":
        // code hash is presented, deploy
        if (this.msg.init?.codeHash !== undefined) {
          this.type = TraceType.DEPLOY;
          // bounced msg
        } else if (this.msg.bounced) {
          this.type = TraceType.BOUNCE;
          // empty body, just transfer
        } else if (this.msg.body === undefined) {
          this.type = TraceType.TRANSFER;
        } else {
          this.type = TraceType.FUNCTION_CALL;
        }
        return;
      // extIn - deploy or function call
      case "ExtIn":
        if (this.msg.init?.codeHash !== undefined) {
          this.type = TraceType.DEPLOY;
        } else {
          this.type = TraceType.FUNCTION_CALL;
        }
        return;
      // extOut - event or return
      case "ExtOut":
        // if this msg was produced by extIn msg, this can be return or event
        if (this.srcTrace !== null && this.srcTrace.msg.msgType === "ExtIn") {
          this.type = TraceType.EVENT_OR_FUNCTION_RETURN;
        } else {
          this.type = TraceType.EVENT;
        }
        return;
      default:
        return;
    }
  }
}
