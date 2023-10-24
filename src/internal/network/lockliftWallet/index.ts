import { GenericAccount } from "everscale-standalone-client";
import { Address } from "everscale-inpage-provider";
import * as nt from "nekoton-wasm";

export class LockliftWallet extends GenericAccount {
  constructor(args: { address: string | Address; publicKey?: string }) {
    super({
      address: args.address,
      publicKey: args.publicKey,
      abi: LOCKLIFT_WALLET_ABI,
      prepareMessage: async (args, ctx) => {
        const payload = args.payload ? ctx.encodeInternalInput(args.payload) : "";

        return {
          method: "sendTransaction",
          params: {
            dest: args.recipient,
            value: args.amount,
            bounce: args.bounce,
            flags: 3,
            payload,
          } as nt.TokensObject,
        };
      },
    });
  }
}
const LOCKLIFT_WALLET_ABI = `{
  "ABI version": 2,
  version: "2.2",
  header: ["pubkey", "time", "expire"],
  functions: [
    {
      name: "constructor",
      inputs: [],
      outputs: [],
    },
    {
      name: "sendTransaction",
      inputs: [
        { name: "dest", type: "address" },
        { name: "value", type: "uint128" },
        { name: "bounce", type: "bool" },
        { name: "flags", type: "uint8" },
        { name: "payload", type: "cell" },
      ],
      outputs: [],
    },
  ],
  data: [],
  events: [],
  fields: [
    { name: "_pubkey", type: "uint256" },
    { name: "_timestamp", type: "uint64" },
    { name: "_constructorFlag", type: "bool" },
  ],
}`;
