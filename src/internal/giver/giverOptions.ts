import { Giver } from "../factory";
import { Address, Contract, ProviderRpcClient, Transaction } from "everscale-inpage-provider";
import { Ed25519KeyPair } from "everscale-standalone-client";

export class GiverFromAccount implements Giver {
  constructor(private readonly ever: ProviderRpcClient, private readonly account: Address) {}

  sendTo(sendTo: Address, value: string): Promise<{ transaction: Transaction; output?: Record<string, unknown> }> {
    return this.ever.sendMessage({
      bounce: false,
      amount: value,
      sender: this.account,
      recipient: sendTo,
    });
  }
}

export class TestnetGiver implements Giver {
  public giverContract: Contract<typeof testnetGiverAbi>;

  constructor(ever: ProviderRpcClient, readonly keyPair: Ed25519KeyPair, address: Address) {
    this.giverContract = new ever.Contract(testnetGiverAbi, address);
  }

  public async sendTo(
    sendTo: Address,
    value: string,
  ): Promise<{ transaction: Transaction; output?: Record<string, unknown> }> {
    return this.giverContract.methods
      .sendGrams({
        dest: sendTo,
        amount: value,
      })
      .sendExternal({ publicKey: this.keyPair.publicKey });
  }
}

const testnetGiverAbi = {
  "ABI version": 2,
  header: ["pubkey", "time", "expire"],
  functions: [
    {
      name: "sendGrams",
      inputs: [
        { name: "dest", type: "address" },
        { name: "amount", type: "uint64" },
      ],
      outputs: [],
    },
  ],
  events: [],
} as const;
