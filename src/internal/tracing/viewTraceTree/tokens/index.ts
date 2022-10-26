import { getTokenBalanceChange } from "./utils";
import { Addressable, ViewTraceTreeWithTotalFee } from "../../types";

export class Tokens {
  constructor(private readonly viewTraceTree: ViewTraceTreeWithTotalFee) {}

  getTokenBalanceChange = (tokenWallet: Addressable) =>
    getTokenBalanceChange(this.viewTraceTree, tokenWallet).toString();
}
