import {Address, Contract, ProviderRpcClient, TransactionWithAccount} from "everscale-inpage-provider";
import {consoleAbi, ConsoleAbi} from "../../console.abi";
import {CONSOLE_ADDRESS} from "./constants";
import {
  buildMsgTree,
  extractAccountsFromMsgTree,
  extractStringAddress,
  getDefaultAllowedCodes,
  throwErrorInConsole
} from "./utils";
import {Trace} from "./trace/trace";
import {
  AccountData,
  Addressable,
  AllowedCodes,
  MessageTree,
  OptionalContracts,
  RevertedBranch,
  TraceParams
} from "./types";
import {Factory} from "../factory";
import _, {difference} from "lodash";
import {logger} from "../logger";
import {ViewTracingTree} from "./viewTraceTree/viewTracingTree";
import {retryWithDelay} from "../httpService";
import {extractTransactionFromParams} from "../../utils";
import {TracingTransport} from "./transport";

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
    private readonly tracingTransport: TracingTransport,
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
  async trace<T>({ finalizedTx, allowedCodes, raise = true }: TraceParams<T>): Promise<ViewTracingTree | undefined> {
    // @ts-ignore
    const external_tx = extractTransactionFromParams(finalizedTx) as TransactionWithAccount;
    const msgTree = buildMsgTree([external_tx, ...finalizedTx.transactions]);
    const accounts = extractAccountsFromMsgTree(msgTree);
    const accountDataList = await this.tracingTransport.getAccountsData(accounts);
    const accountDataMap = accountDataList.reduce((acc, accountData) => ({...acc, [accountData.id]: accountData}), {});

    const allowedCodesExtended = _.mergeWith(_.cloneDeep(this._allowedCodes), allowedCodes, (objValue, srcValue) =>
      Array.isArray(objValue) ? objValue.concat(srcValue) : undefined,
    );
    const traceTree = await this.buildTracingTree(msgTree, allowedCodesExtended, accountDataMap);

    const reverted = this.findRevertedBranch(_.cloneDeep(traceTree));
    if (reverted && raise) {
      throwErrorInConsole(reverted);
    }
    return new ViewTracingTree(traceTree, this.factory.getContractByCodeHash, accountDataList);
  }

  private async printConsoleMsg(msg: MessageTree) {
    const decoded = await this.ever.rawApi.decodeEvent({
      body: msg.body,
      abi: JSON.stringify(consoleAbi),
      event: "Log",
    });
    logger.printInfo(decoded && "_log" in decoded.data && decoded.data._log);
  }

  private async buildTracingTree(
    msgTree: MessageTree,
    allowedCodes: AllowedCodes = { compute: [], action: [], contracts: { any: { compute: [], action: [] } } },
    accountData: { [key: string]: AccountData },
  ): Promise<Trace> {
    const trace = new Trace(this, msgTree, null, {accounts: accountData});
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
