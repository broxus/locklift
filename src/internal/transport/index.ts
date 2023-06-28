import * as nt from "nekoton-wasm";
import {IProxyConnector, makeFullAccountBoc, parseFullAccountBoc} from "nekoton-wasm";
import {Address, FullContractState, ProviderRpcClient} from "everscale-inpage-provider";


export class ProxyConnector implements IProxyConnector {
  info(): void {
    console.log(123);
  }
  getAccountsByCodeHash(codeHash: string, limit: number, continuation?: string): Array<string> {
    console.log("This was cached in local js class11!!!");
    // const state = "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";
    const addr = "0:311fe8e7bfeb6a2622aaba02c21569ac1e6f01c81c33f2623e5d8f1a5ba232d7"
    return Array.from([addr]) as Array<string>;
  }

  getBlockchainConfig(): string[] {
    console.log(123);
    return [];
  }

  getCapabilities(clock_offset_as_sec: string, clock_offset_as_ms: string): string[] {
    console.log(123);
    return [];
  }

  getContractState(address: string): string | undefined {
    console.log(123);
    return undefined;
  }

  getDstTransaction(): string | undefined {
    console.log(123);
    return undefined;
  }

  getLatestKeyBlock(): string {
    console.log(123);
    return "";
  }

  getTransaction(): string | undefined {
    console.log(123);
    return undefined;
  }

  getTransactions(address: string, fromLt: string, count: number): string[] {
    console.log(123);
    return [];
  }

  sendMessage(message: string): void {
    console.log(123);
  }
}

export function getProxyConnection() {
  const clock = new nt.ClockWithOffset();
  const proxy = new ProxyConnector();
  return new nt.ProxyConnection(clock, proxy);
}


export class LocalExecutor {
  private disable_signatures: boolean;
  private messages: {};
  private states: {[id: string] : FullContractState};
  private use_empty_states: boolean;
  constructor(
    private readonly provider: ProviderRpcClient
  ) {
    this.messages = {}
    this.states = {}
    this.disable_signatures = false
    this.use_empty_states = true
  }

  disable_signature_check() {
    this.disable_signatures = true;
  }

  set_account_state(address: Address, boc: string) {
    this.states[address.toString()] = parseFullAccountBoc(boc)!;
  }

  async get_account_state(address: Address) {
    if (this.states[address.toString()] === undefined) {
        this.states[address.toString()] = this.use_empty_states ?
        parseFullAccountBoc(makeFullAccountBoc())! :
        (await this.provider.getFullContractState({address})).state!;
    }
    return this.states[address.toString()];
  }

  set_breakpoint() {

  }

  resume_breakpoint() {

  }

  clear_breakpoints() {

  }

  // process all msgs in queue
  process_queue() {

  }

  // process msg with lowest lt in queue
  process_next_msg() {

  }

  // push new message to queue
  push_msg() {

  }
}
