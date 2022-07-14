import { Address, Transaction } from "everscale-inpage-provider";
export interface GiverI {
    sendTo(sendTo: Address, value: string): Promise<{
        transaction: Transaction;
        output?: Record<string, unknown>;
    }>;
}
