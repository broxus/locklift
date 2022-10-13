import { Addressable, DecodedMsg, ViewTraceTree } from "../../types";
import BigNumber from "bignumber.js";
import { extractAddress } from "../../utils";

export const getTokenBalanceChange = (viewTrace: ViewTraceTree, tokenWallet: Addressable): BigNumber => {
  const msg = viewTrace.decodedMsg;

  const balanceChange =
    viewTrace.contract.contract.address.equals(extractAddress(tokenWallet)) && isChangeTokenBalanceTransaction(msg)
      ? getBalanceUpdates({ amount: msg.params.amount, method: msg.method })
      : new BigNumber(0);

  return viewTrace.outTraces.reduce(
    (acc, internalTrace) => acc.plus(getTokenBalanceChange(internalTrace, tokenWallet)),
    balanceChange,
  );
};

enum BalanceChange {
  INCREASE = "INCREASE",
  DECREASE = "DECREASE",
}
const tokenTransferMatchers: Record<string, BalanceChange> = {
  transfer: BalanceChange.DECREASE,
  transferToWallet: BalanceChange.DECREASE,
  burn: BalanceChange.DECREASE,
  acceptTransfer: BalanceChange.INCREASE,
  acceptMint: BalanceChange.INCREASE,
};

const getBalanceUpdates = ({
  amount,
  method,
}: {
  method: keyof typeof tokenTransferMatchers;
  amount: string;
}): BigNumber => {
  const operation = tokenTransferMatchers[method];
  switch (operation) {
    case BalanceChange.INCREASE:
      return new BigNumber(amount);
    case BalanceChange.DECREASE:
      return new BigNumber(amount).negated();
  }
};

const isChangeTokenBalanceTransaction = (
  msg: DecodedMsg | undefined,
): msg is { method: keyof typeof tokenTransferMatchers; params: { amount: string } } => {
  return !!msg?.method && msg.method !== "constructor" && !!tokenTransferMatchers[msg.method];
};
