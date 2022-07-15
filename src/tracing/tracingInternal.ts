import { Address, Contract, ProviderRpcClient } from "everscale-inpage-provider";
import { consoleAbi, ConsoleAbi } from "../console.abi";
import { CONSOLE_ADDRESS } from "./constants";
import { fetchMsgData, throwErrorInConsole } from "./utils";
import { Trace } from "./trace/trace";
import { AllowedCodes, MsgTree, OptionalContracts, RevertedBranch, TraceParams } from "./types";
import { Factory } from "../factory";
import _ from "lodash";

export class TracingInternal {
  private readonly consoleContract: Contract<ConsoleAbi>;
  private _allowedCodes: AllowedCodes = {
    compute: [],
    action: [],
    contracts: {},
  };
  constructor(
    private readonly ever: ProviderRpcClient,
    private readonly factory: Factory<any>,
    private readonly endpoint: string,
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
      this._allowedCodes.contracts[address].compute.map(code => {
        const idx = this._allowedCodes.contracts[address].compute.indexOf(code);
        if (idx > -1) {
          this._allowedCodes.contracts[address].compute.splice(idx, 1);
        }
      });
    }
    if (allowedCodes.action) {
      this._allowedCodes.contracts[address].action.map(code => {
        const idx = this._allowedCodes.contracts[address].action.indexOf(code);
        if (idx > -1) {
          this._allowedCodes.contracts[address].action.splice(idx, 1);
        }
      });
    }
  }

  removeAllowedCodes(allowedCodes: OptionalContracts = { compute: [], action: [] }) {
    if (allowedCodes.compute) {
      allowedCodes.compute.map(code => {
        const idx = this._allowedCodes.compute.indexOf(code);
        if (idx > -1) {
          this._allowedCodes.compute.splice(idx, 1);
        }
      });
    }
    if (allowedCodes.action) {
      allowedCodes.action.map(code => {
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
      const msgTree = await this.buildMsgTree(inMsgId, this.endpoint);
      const allowedCodesExtended = _.merge(_.cloneDeep(this._allowedCodes), allowedCodes);
      const traceTree = await this.buildTracingTree(msgTree, allowedCodesExtended);
      const reverted = this.findRevertedBranch(traceTree);
      if (reverted) {
        throwErrorInConsole(reverted);
      }
      return msgTree;
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

  private async buildMsgTree(inMsgId: string, endpoint: string, onlyRoot = false) {
    const msg = await fetchMsgData(inMsgId, endpoint);
    if (onlyRoot) {
      return msg;
    }
    if (msg.dst === CONSOLE_ADDRESS) {
      await this.printConsoleMsg(msg);
    }
    msg.outMessages = [];
    if (msg.dst_transaction && msg.dst_transaction.out_msgs.length > 0) {
      msg.outMessages = await Promise.all(
        msg.dst_transaction.out_msgs.map(async (msgId: string) => {
          return await this.buildMsgTree(msgId, endpoint);
        }),
      );
    }
    return msg;
  }

  private async buildTracingTree(
    msgTree: MsgTree,
    allowedCodes: AllowedCodes = { compute: [], action: [], contracts: { any: { compute: [], action: [] } } },
  ): Promise<Trace> {
    const trace = new Trace(this, msgTree, null);
    await trace.buildTree(allowedCodes, this.factory.getContractByCodeHash);
    return trace;
  }

  // apply depth-first search on trace tree, return first found reverted branch
  private findRevertedBranch(traceTree: Trace): Array<RevertedBranch> | undefined {
    if (!traceTree.hasErrorInTree) {
      return;
    }
    return this.depthSearch(traceTree, 1, 0);
  }

  private depthSearch(traceTree: Trace, totalActions: number, actionIdx: number): Array<RevertedBranch> | undefined {
    if (traceTree.error && !traceTree.error.ignored) {
      // clean unnecessary structure
      traceTree.outTraces = [];
      return [{ totalActions, actionIdx: actionIdx, traceLog: traceTree }];
    }

    for (const [index, trace] of traceTree.outTraces.entries()) {
      const actionsNum = traceTree.outTraces.length;
      const corruptedBranch = this.depthSearch(trace, actionsNum, index);
      if (corruptedBranch) {
        // clean unnecessary structure
        traceTree.outTraces = [];
        return [{ totalActions, actionIdx, traceLog: traceTree }].concat(corruptedBranch);
      }
    }
  }
}
