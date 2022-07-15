import { Address, Transaction } from "everscale-inpage-provider";

export interface IGiver {
  sendTo(sendTo: Address, value: string): Promise<{ transaction: Transaction; output?: Record<string, unknown> }>;
}
