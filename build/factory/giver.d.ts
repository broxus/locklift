import { Address, Transaction } from "everscale-inpage-provider";
export interface GiverI<Abi = any> {
    sendTo(sendTo: Address, value: string): Promise<{
        transaction: Transaction;
        output?: {};
    }>;
}
