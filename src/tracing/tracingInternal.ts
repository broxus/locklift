import { Address, Contract, ProviderRpcClient } from "everscale-inpage-provider";
import { consoleAbi, ConsoleAbi } from "../console.abi";
import { CONSOLE_ADDRESS } from "./constances";
import { fetchMsgData, throwErrorInConsole } from "./utils";
import { Trace } from "./trace/trace";
import { AllowedCodes, MsgTree, OptionalContracts, RevertedBranch, TraceParams } from "./types";
import { Factory } from "../factory";
import _ from "lodash";

export class TracingInternal<Abi = any> {
  private readonly consoleContract: Contract<ConsoleAbi>;
  private _allowedCodes: AllowedCodes = {
    compute: [],
    action: [],
    contracts: {},
  };
  constructor(
    private readonly ever: ProviderRpcClient,
    private readonly factory: Factory<any>,
    private readonly endPoint: string,
    private readonly enabled = false,
  ) {
    this.consoleContract = new ever.Contract(consoleAbi, new Address(CONSOLE_ADDRESS));
  }
  get allowedCodes(): AllowedCodes {
    return this._allowedCodes;
  }
  setAllowCodes(allowedCodes: OptionalContracts = { compute: [], action: [] }) {
    this._allowedCodes = {
      ...this._allowedCodes,
      action: [...this._allowedCodes.action, ...allowedCodes.action],
      compute: [...this._allowedCodes.compute, ...allowedCodes.compute],
    };
  }

  allowCodesForAddress(address: string, allowedCodes: OptionalContracts = { compute: [], action: [] }) {
    if (!this._allowedCodes.contracts?.[address]) {
      this._allowedCodes.contracts[address] = { compute: [], action: [] };
    }
    if (allowedCodes.compute) {
      this._allowedCodes.contracts[address].compute.push(...allowedCodes.compute);
    }
    if (allowedCodes.action) {
      this._allowedCodes.contracts[address].action.push(...allowedCodes.action);
    }
  }

  removeAllowedCodesForAddress(address: string, allowedCodes: OptionalContracts = { compute: [], action: [] }) {
    if (!this._allowedCodes.contracts[address]) {
      this._allowedCodes.contracts[address] = { compute: [], action: [] };
    }
    if (allowedCodes.compute) {
      this._allowedCodes.contracts[address].compute.map((code) => {
        const idx = this._allowedCodes.contracts[address].compute.indexOf(code);
        if (idx > -1) {
          this._allowedCodes.contracts[address].compute.splice(idx, 1);
        }
      });
    }
    if (allowedCodes.action) {
      this._allowedCodes.contracts[address].action.map((code) => {
        const idx = this._allowedCodes.contracts[address].action.indexOf(code);
        if (idx > -1) {
          this._allowedCodes.contracts[address].action.splice(idx, 1);
        }
      });
    }
  }

  removeAllowedCodes(allowedCodes: OptionalContracts = { compute: [], action: [] }) {
    if (allowedCodes.compute) {
      allowedCodes.compute.map((code) => {
        const idx = this._allowedCodes.compute.indexOf(code);
        if (idx > -1) {
          this._allowedCodes.compute.splice(idx, 1);
        }
      });
    }
    if (allowedCodes.action) {
      allowedCodes.action.map((code) => {
        const idx = this._allowedCodes.action.indexOf(code);
        if (idx > -1) {
          this._allowedCodes.action.splice(idx, 1);
        }
      });
    }
  }
  // allowed_codes example - {compute: [100, 50, 12], action: [11, 12], "ton_addr": {compute: [60], action: [2]}}
  async trace({
    inMsgId,
    allowedCodes = { compute: [], action: [], contracts: { any: { compute: [], action: [] } } },
  }: TraceParams) {
    if (this.enabled) {
      const msg_tree = await this.buildMsgTree(inMsgId, this.endPoint);
      let allowedCodesExtended = _.merge(_.cloneDeep(this._allowedCodes), allowedCodes);
      const trace_tree = await this.buildTracingTree(msg_tree, allowedCodesExtended);
      const reverted = this.findRevertedBranch(trace_tree);
      if (reverted) {
        throwErrorInConsole(reverted);
      }
      return msg_tree;
    }
  }

  private async printConsoleMsg(msg: MsgTree) {
    const decoded = await this.consoleContract.decodeInputMessage({
      methods: ["log"],
      body: msg.body,
      internal: true,
    });
    console.log(decoded?.input);
  }

  private async buildMsgTree(in_msg_id: string, endPoint: string, only_root = false) {
    const msg = await fetchMsgData(in_msg_id, endPoint);
    if (only_root) {
      return msg;
    }
    if (msg.dst === CONSOLE_ADDRESS) {
      await this.printConsoleMsg(msg);
    }
    msg.out_messages = [];
    if (msg.dst_transaction && msg.dst_transaction.out_msgs.length > 0) {
      msg.out_messages = await Promise.all(
        msg.dst_transaction.out_msgs.map(async (msg_id: string) => {
          return await this.buildMsgTree(msg_id, endPoint);
        }),
      );
    }
    return msg;
  }

  private async buildTracingTree(
    msg_tree: MsgTree,
    allowedCodes: AllowedCodes = { compute: [], action: [], contracts: { any: { compute: [], action: [] } } },
  ): Promise<Trace> {
    const trace = new Trace(this, msg_tree, null);
    await trace.buildTree(allowedCodes, this.factory.getContractByCodeHash);
    return trace;
  }

  // apply depth-first search on trace tree, return first found reverted branch
  private findRevertedBranch(traceTree: Trace): Array<RevertedBranch> | undefined {
    if (!traceTree.has_error_in_tree) {
      return;
    }
    return this.depthSearch(traceTree, 1, 0);
  }

  private depthSearch(traceTree: Trace, totalActions: number, actionIdx: number): Array<RevertedBranch> | undefined {
    if (traceTree.error && !traceTree.error.ignored) {
      // clean unnecessary structure
      traceTree.out_traces = [];
      return [{ totalActions, actionIdx: actionIdx, traceLog: traceTree }];
    }

    for (const [index, trace] of traceTree.out_traces.entries()) {
      const actionsNum = traceTree.out_traces.length;
      const corrupted_branch = this.depthSearch(trace, actionsNum, index);
      if (corrupted_branch) {
        // clean unnecessary structure
        traceTree.out_traces = [];
        return [{ totalActions, actionIdx, traceLog: traceTree }].concat(corrupted_branch);
      }
    }
  }
}
