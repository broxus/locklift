import { Address, Contract, ProviderRpcClient } from "everscale-inpage-provider";
import { consoleAbi, ConsoleAbi } from "../../console.abi";
import { CONSOLE_ADDRESS } from "./constants";
import { extractAccountsFromMsgTree, extractStringAddress, getDefaultAllowedCodes, throwErrorInConsole } from "./utils";
import { Trace } from "./trace/trace";
import {
  AccountData,
  Addressable,
  AllowedCodes,
  MessageTree,
  OptionalContracts,
  RevertedBranch,
  TraceParams,
  TransactionWithAccountAndBoc,
  TruncatedTransaction,
} from "./types";
import { Factory } from "../factory";
import _, { difference } from "lodash";
import { logger } from "../logger";
import { ViewTracingTree } from "./viewTraceTree/viewTracingTree";
import { extractTransactionFromParams } from "../../utils";
import { TracingTransport } from "./transport";
import { decodeRawTransaction, JsRawMessage } from "nekoton-wasm";
import { LockliftNetwork } from "@broxus/locklift-network";

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
    readonly factory: Factory<any>,
    private readonly tracingTransport: TracingTransport,
    readonly network: LockliftNetwork,
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

  private popKey = (obj: any, key: string): any => {
    const value = obj[key];
    delete obj[key];
    return value;
  };

  // input transactions are unordered
  private buildMsgTree = async (transactions: TransactionWithAccountAndBoc[]): Promise<MessageTree> => {
    type _ShortMessageTree = JsRawMessage & {
      dstTransaction: TruncatedTransaction | undefined;
      outMessages: Array<JsRawMessage>;
    };
    // restructure transaction inside out for more convenient access in later processing
    const hashToMsg: { [msg_hash: string]: _ShortMessageTree } = {};
    const msgs = transactions.map((tx): _ShortMessageTree => {
      const extendedTx = decodeRawTransaction(tx.boc);
      const inMsg: JsRawMessage = this.popKey(extendedTx, "inMessage");
      const description = this.popKey(extendedTx, "description");
      const outMsgs: JsRawMessage[] = this.popKey(extendedTx, "outMessages");
      const msg: _ShortMessageTree = {
        ...inMsg,
        dstTransaction: { ...extendedTx, ...description },
        outMessages: outMsgs,
      };
      hashToMsg[msg.hash] = msg;
      // special move for extOut messages (events), because they don't have dstTransaction
      msg.outMessages.map(outMsg => {
        if (outMsg.msgType === "ExtOut") {
          // console.log(outMsg);
          hashToMsg[outMsg.hash] = { ...outMsg, dstTransaction: undefined, outMessages: [] };
        }
      });
      return msg;
    });
    // recursively build message tree
    const buildTree = async (msgHash: string): Promise<MessageTree> => {
      const msg = hashToMsg[msgHash];
      if (msg.dst === CONSOLE_ADDRESS) {
        await this.printConsoleMsg(msg as MessageTree);
      }
      const outMessages = await Promise.all(msg.outMessages.map(async outMsg => buildTree(outMsg.hash)));
      return { ...msg, outMessages };
    };

    return await buildTree(msgs[0].hash);
  };

  // allowed_codes example - {compute: [100, 50, 12], action: [11, 12], "ton_addr": {compute: [60], action: [2]}}
  async trace<T>({ finalizedTx, allowedCodes, raise = true }: TraceParams<T>): Promise<ViewTracingTree | undefined> {
    // @ts-ignore
    const externalTx = extractTransactionFromParams(finalizedTx.extTransaction) as TransactionWithAccountAndBoc;
    const msgTree = await this.buildMsgTree([externalTx, ...finalizedTx.transactions]);
    const accounts = extractAccountsFromMsgTree(msgTree);
    const accountDataList = await this.tracingTransport.getAccountsData(accounts);
    const accountDataMap = accountDataList.reduce(
      (acc, accountData) => ({ ...acc, [accountData.id]: accountData }),
      {},
    );

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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      body: msg.body!,
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
    const trace = new Trace(this, msgTree, null, { accounts: accountData });
    await trace.buildTree(allowedCodes);
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
