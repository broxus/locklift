import { AccountsStorageContext, GenericAccount, PrepareMessageParams, Signer } from "everscale-standalone-client";
import { Address, TokensObject } from "everscale-inpage-provider";
import { Account } from "everscale-standalone-client/nodejs";
import * as nt from "nekoton-wasm";

// type GenericAccountCall = {
//   method: string;
//   params: TokensObject<string>;
//   stateInit?: string;
// };
// type PrepareMessage = (args: PrepareMessageParams, ctx: AccountsStorageContext) => Promise<GenericAccountCall>;
// export class LockliftWallet implements Account {
//   constructor(readonly address: Address, private readonly signer: Signer) {}
//
//   public async fetchPublicKey(ctx: AccountsStorageContext): Promise<string> {
//     return this.signer.publicKey;
//   }
//
//   async prepareMessage(args: PrepareMessageParams, ctx: AccountsStorageContext): Promise<nt.SignedMessage> {
//     const signer = this.signer;
//
//     const { method, params, stateInit } = await this.prepareMessageImpl(args, ctx);
//
//     return ctx.createExternalMessage({
//       address: this.address,
//       signer,
//       timeout: args.timeout,
//       abi: LOCKLIFT_WALLET_ABI,
//       method,
//       params,
//       stateInit,
//       signatureId: args.signatureId,
//     });
//   }
//
//   private prepareMessageImpl: PrepareMessage = async (args, ctx) => {
//     const payload = args.payload ? ctx.encodeInternalInput(args.payload) : "";
//
//     return {
//       method: "sendTransaction",
//       params: {
//         dest: args.recipient,
//         value: args.amount,
//         bounce: args.bounce,
//         flags: 3,
//         payload,
//       } as nt.TokensObject,
//     };
//   };
// }
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
