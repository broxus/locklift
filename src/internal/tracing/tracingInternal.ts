import { Address, Contract, ProviderRpcClient } from "everscale-inpage-provider";
import { consoleAbi, ConsoleAbi } from "../../console.abi";
import { CONSOLE_ADDRESS } from "./constants";
import { extractStringAddress, fetchMsgData, getDefaultAllowedCodes, throwErrorInConsole } from "./utils";
import { Trace } from "./trace/trace";
import { Addressable, AllowedCodes, MsgTree, OptionalContracts, RevertedBranch, TraceParams } from "./types";
import { Factory } from "../factory";
import _, { difference } from "lodash";
import { logger } from "../logger";
import { ViewTracingTree } from "./viewTraceTree/viewTracingTree";
import { retryWithDelay } from "../httpService";

export class TracingInternal {
  private labelsMap = new Map<string, string>();

  private readonly consoleContract: Contract<ConsoleAbi>;
  private _allowedCodes: Required<AllowedCodes> = {
    ...getDefaultAllowedCodes(),
    contracts: {},
  };
  public setContractLabels = (contracts: Array<{ address: Addressable; label: string }>) => {
    contracts.forEach(({ address, label }) => this.labelsMap.set(extractStringAddress(address), label));
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

  setAllowedCodes(allowedCodes: OptionalContracts) {
    if (allowedCodes.action) {
      this._allowedCodes.action.push(...allowedCodes.action);
    }
    if (allowedCodes.compute) {
      this._allowedCodes.compute.push(...allowedCodes.compute);
    }
  }

  setAllowedCodesForAddress(address: string | Address, allowedCodes: OptionalContracts) {
    const stringAddress = address.toString();
    if (!this._allowedCodes.contracts?.[stringAddress]) {
      this._allowedCodes.contracts[stringAddress] = getDefaultAllowedCodes();
    }
    if (allowedCodes.compute) {
      (this._allowedCodes.contracts[stringAddress].compute || []).push(...allowedCodes.compute);
    }
    if (allowedCodes.action) {
      (this._allowedCodes.contracts[stringAddress].action || []).push(...allowedCodes.action);
    }
  }

  removeAllowedCodesForAddress(address: string | Address, codesToRemove: OptionalContracts) {
    const stringAddress = address.toString();
    if (codesToRemove.compute) {
      this._allowedCodes.contracts[stringAddress].compute = difference(
        this._allowedCodes.contracts[stringAddress]?.compute || [],
        codesToRemove.compute,
      );
    }
    if (codesToRemove.action) {
      this._allowedCodes.contracts[stringAddress].action = difference(
        this._allowedCodes.contracts[stringAddress]?.action || [],
        codesToRemove.action,
      );
    }
  }

  removeAllowedCodes(codesToRemove: OptionalContracts) {
    if (codesToRemove.compute) {
      this._allowedCodes.compute = difference(this._allowedCodes.compute || [], codesToRemove.compute);
    }
    if (codesToRemove.action) {
      this._allowedCodes.action = difference(this._allowedCodes.action || [], codesToRemove.action);
    }
  }
  // allowed_codes example - {compute: [100, 50, 12], action: [11, 12], "ton_addr": {compute: [60], action: [2]}}
  async trace({ inMsgId, allowedCodes, raise = true }: TraceParams) {
    if (this.enabled) {
      const msgTree = await this.buildMsgTree(inMsgId, this.endpoint);
      const allowedCodesExtended = _.mergeWith(_.cloneDeep(this._allowedCodes), allowedCodes, (objValue, srcValue) =>
        Array.isArray(objValue) ? objValue.concat(srcValue) : undefined,
      );
      const traceTree = await this.buildTracingTree(msgTree, allowedCodesExtended);

      const reverted = this.findRevertedBranch(_.cloneDeep(traceTree));
      if (reverted && raise) {
        throwErrorInConsole(reverted);
      }
      return new ViewTracingTree(traceTree, this.factory.getContractByCodeHash, this.endpoint);
    }
    logger.printWarn("You need to provide tracing endPoint to enable trace");
  }

  private async printConsoleMsg(msg: MsgTree) {
    const decoded = await this.ever.rawApi.decodeEvent({
      body: msg.body,
      abi: JSON.stringify(consoleAbi),
      event: "Log",
    });
    logger.printInfo(decoded && "_log" in decoded.data && decoded.data._log);
  }

  private async buildMsgTree(inMsgId: string, endpoint: string, onlyRoot = false) {
    const msg = await retryWithDelay(
      () =>
        fetchMsgData(inMsgId, endpoint).then(res => {
          if (!res) {
            throw new Error(`Not found msg by ${inMsgId} id`);
          }
          return res;
        }),
      { delay: 1500, count: 5 },
    );
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
    await trace.buildTree(allowedCodes, this.factory.getContractByCodeHashOrDefault);
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
