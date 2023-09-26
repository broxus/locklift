import { AccountData, Addressable, AllowedCodes, MsgTree, RevertedBranch, TraceType } from "./types";
import { logger } from "../logger";
import { httpService } from "../httpService";
import { Address } from "everscale-inpage-provider";
import BigNumber from "bignumber.js";

export const fetchMsgData = async (msgId: string, endpoint: string): Promise<MsgTree> => {
  const msgQuery = `{
    messages(
      timeout: 1000,
      filter: {
        id: {
          eq: "${msgId}"
        }
      }
    ) {
      id
      body
      code_hash
      src
      msg_type
      dst
      dst_account {
        id
        code_hash
      }
      src_account{
        id
        code_hash
      }
      dst_transaction {
        status
        total_fees
        aborted
        out_msgs
        storage {
          storage_fees_collected
        }
        compute {
          exit_code
          compute_type
          success
          gas_fees
        }
        action {
          result_code
          success
          total_action_fees
          total_fwd_fees
        }
      }
      status
      value
      bounced
      bounce
    }
  }`;
  const response = await httpService
    .post<{ data: { messages: Array<MsgTree> } }>(endpoint, { query: msgQuery })

    .then(res => res.data.data);
  return response.messages[0];
};
export const fetchAccounts = async (accounts: Array<Address>, endpoint: string): Promise<Array<AccountData>> => {
  const msgQuery = `{
  accounts(
    filter: {
      id: {
        in: ${JSON.stringify(accounts.map(account => account.toString()))}
      }
    }
  ) {
    code_hash
    id
  }
}`;
  const response = await httpService
    .post<{ data: { accounts: Array<AccountData> } }>(endpoint, { query: msgQuery })

    .then(res => res.data.data);
  return response.accounts;
};
export const convert = (number: number, decimals = 9, precision = 4) => {
  if (number === null) {
    return null;
  }
  return (number / 10 ** decimals).toPrecision(precision);
};

export const convertForLogger = (amount: number) => new BigNumber(convert(amount, 9, 8) || 0);
export const hexToValue = (amount: number) => new BigNumber(convert(amount, 9, 9) || 0);

export const throwErrorInConsole = <Abi>(revertedBranch: Array<RevertedBranch<Abi>>) => {
  for (const { totalActions, actionIdx, traceLog } of revertedBranch) {
    const bounce = traceLog.msg.bounce;
    let name = "undefinedContract";
    if (traceLog.contract) {
      name = traceLog.contract.name;
    }
    let method = "undefinedMethod";
    if (traceLog.decodedMsg?.method) {
      method = traceLog.decodedMsg.method;
    } else if (traceLog.type === TraceType.BOUNCE) {
      method = "onBounce";
    }
    let paramsStr = "()";
    if (traceLog.decodedMsg) {
      if (Object.values(traceLog.decodedMsg.params || {}).length === 0) {
        paramsStr = "()";
      } else {
        paramsStr = "(\n";
        for (const [key, value] of Object.entries(traceLog.decodedMsg.params || {})) {
          paramsStr += `    ${key}: ${JSON.stringify(value, null, 4)}\n`;
        }
        paramsStr += ")";
      }
    }

    logger.printTracingLog("\t\t⬇\n\t\t⬇");
    logger.printTracingLog(`\t#${actionIdx + 1} action out of ${totalActions}`);
    // green tags
    logger.printTracingLog(`Addr: \x1b[32m${traceLog.msg.dst}\x1b[0m`);
    logger.printTracingLog(`MsgId: \x1b[32m${traceLog.msg.id}\x1b[0m`);
    logger.printTracingLog("-----------------------------------------------------------------");
    if (traceLog.type === TraceType.BOUNCE) {
      logger.printTracingLog("-> Bounced msg");
    }
    if (traceLog.error && traceLog.error.ignored) {
      logger.printTracingLog(`-> Ignored ${traceLog.error.code} code on ${traceLog.error.phase} phase`);
    }
    if (!traceLog.contract) {
      logger.printTracingLog("-> Contract not deployed/Not recognized because build artifacts not provided");
    }
    // bold tag
    logger.printTracingLog(
      `\x1b[1m${name}.${method}\x1b[22m{value: ${convert(traceLog.msg.value)}, bounce: ${bounce}}${paramsStr}`,
    );
    if (traceLog.msg.dst_transaction) {
      if (traceLog.msg.dst_transaction.storage) {
        logger.printTracingLog(`Storage fees: ${convert(traceLog.msg.dst_transaction.storage.storage_fees_collected)}`);
      }
      if (traceLog.msg.dst_transaction.compute) {
        logger.printTracingLog(`Compute fees: ${convert(Number(traceLog.msg.dst_transaction.compute.gas_fees))}`);
      }
      if (traceLog.msg.dst_transaction.action) {
        logger.printTracingLog(
          `Action fees: ${convert(Number(traceLog.msg.dst_transaction.action.total_action_fees))}`,
        );
      }
      logger.printTracingLog(`\x1b[1mTotal fees:\x1b[22m ${convert(Number(traceLog.msg.dst_transaction.total_fees))}`);
    }
    if (traceLog.error && !traceLog.error.ignored) {
      // red tag
      logger.printError(
        "\x1b[31m",
        `!!! Reverted with ${traceLog.error.code} error code on ${traceLog.error.phase} phase !!!`,
      );
      throw new Error(`Reverted with ${traceLog.error.code} code on ${traceLog.error.phase} phase`);
    }
  }
};
export const isT = <T>(p: T): p is NonNullable<T> => !!p;
export const getDefaultAllowedCodes = (): Omit<Required<AllowedCodes>, "contracts"> => ({
  compute: [],
  action: [],
});
export const isExistsInArr = <T>(srcArr: Array<T>, isExist: T): boolean => {
  return srcArr.some(item => item === isExist);
};

export const extractStringAddress = (contract: Addressable) =>
  typeof contract === "string"
    ? contract
    : contract instanceof Address
    ? contract.toString()
    : contract.address.toString();

export const extractAddress = (contract: Addressable): Address => new Address(extractStringAddress(contract));
