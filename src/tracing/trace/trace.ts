import { CONSOLE_ADDRESS } from "../constances";
import { AllowedCodes, MsgTree, TraceType } from "../types";
import { Address } from "everscale-inpage-provider";
import { AbiFunctionName } from "everscale-inpage-provider/dist/models";
import { DecodedInput } from "everscale-inpage-provider/dist/contract";
import { ContractWithName } from "../../types";
import { contractContractInformation } from "./utils";
import { TracingInternal } from "../tracingInternal";

export class Trace<Abi = any> {
  outTraces: Array<any> = [];
  error: any = null;

  type: TraceType | null = null;
  contract!: ContractWithName;
  decodedMsg: DecodedInput<Abi, AbiFunctionName<Abi>> | undefined = undefined;
  hasErrorInTree = false;
  constructor(
    private readonly tracing: TracingInternal,
    readonly msg: MsgTree,
    private readonly srcTrace: any = null,
  ) {}

  async buildTree(
    allowedCodes: AllowedCodes = { compute: [], action: [], contracts: { any: { compute: [], action: [] } } },
    contractGetter: (codeHash: string, address: Address) => ContractWithName<Abi> | undefined,
  ) {
    this.setMsgType();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { codeHash, address } = contractContractInformation({ msg: this.msg, type: this.type! });
    const contract = contractGetter(codeHash || "", new Address(address));

    this.checkForErrors(allowedCodes);
    await this.decode(contract);
    for (const msg of this.msg.outMessages) {
      const trace = new Trace(this.tracing, msg, this);
      await trace.buildTree(allowedCodes, contractGetter);
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
    const tx = this.msg.dst_transaction;

    if (this.msg.dst === CONSOLE_ADDRESS) {
      return;
    }

    let skipComputeCheck = false;
    if (tx && (tx.compute.success || tx.compute.compute_type === 0) && !tx.aborted) {
      skipComputeCheck = true;
    }
    let skipActionCheck = false;
    if (tx && tx.action && tx.action.success) {
      skipActionCheck = true;
    }

    // error occured during compute phase
    if (!skipComputeCheck && tx && tx.compute.exit_code !== 0) {
      this.error = { phase: "compute", code: tx.compute.exit_code };
      // we didnt expect this error, save error
      if (
        allowedCodes.compute.indexOf(tx.compute.exit_code) > -1 ||
        (allowedCodes.contracts[this.msg.dst] &&
          allowedCodes.contracts[this.msg.dst].compute.indexOf(tx.compute.exit_code) > -1)
      ) {
        this.error.ignored = true;
      }
    } else if (!skipActionCheck && tx && tx.action && tx.action.result_code !== 0) {
      this.error = { phase: "action", code: tx.action.result_code };
      // we didnt expect this error, save error
      if (
        allowedCodes.action.indexOf(tx.action.result_code) > -1 ||
        (allowedCodes.contracts[this.msg.dst] &&
          allowedCodes.contracts[this.msg.dst].action.indexOf(tx.action.result_code) > -1)
      ) {
        this.error.ignored = true;
      }
    }
    if (this.error && !this.error.ignored) {
      this.hasErrorInTree = true;
    }
  }

  async decodeMsg(contract: ContractWithName | null = null) {
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
      if (this.srcTrace.decoded_msg && this.srcTrace.decoded_msg.value?.answerId === "0") {
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

    const isInternal = this.msg.msg_type === 0;

    const parsedAbi = JSON.parse(contract.contract.abi) as { functions: Array<{ name: AbiFunctionName<Abi> }> };
    const decodedMsg = await contract.contract.decodeInputMessage({
      internal: isInternal,
      body: this.msg.body,
      methods: parsedAbi.functions.map((el) => el.name),
    });
    // determine more precisely is it an event or function return
    if (this.type === TraceType.EVENT_OR_FUNCTION_RETURN) {
      // @ts-ignore
      const isFunctionReturn = parsedAbi.functions.find(({ name }) => name === decodedMsg.method);
      if (isFunctionReturn) {
        this.type = TraceType.FUNCTION_RETURN;
      } else {
        this.type = TraceType.EVENT;
      }
    }

    this.decodedMsg = decodedMsg;
  }

  async decode(contract: ContractWithName<Abi> | undefined) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.contract = contract!;
    await this.decodeMsg(contract);
  }

  setMsgType() {
    switch (this.msg.msg_type) {
      // internal - deploy or function call or bound or transfer
      case 0:
        // code hash is presented, deploy
        if (this.msg.code_hash !== null) {
          this.type = TraceType.DEPLOY;
          // bounced msg
        } else if (this.msg.bounced) {
          this.type = TraceType.BOUNCE;
          // empty body, just transfer
        } else if (this.msg.body === null) {
          this.type = TraceType.TRANSFER;
        } else {
          this.type = TraceType.FUNCTION_CALL;
        }
        return;
      // extIn - deploy or function call
      case 1:
        if (this.msg.code_hash !== null) {
          this.type = TraceType.DEPLOY;
        } else {
          this.type = TraceType.FUNCTION_CALL;
        }
        return;
      // extOut - event or return
      case 2:
        // if this msg was produced by extIn msg, this can be return or event
        if (this.srcTrace !== null && this.srcTrace.msg.msg_type === 1) {
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
