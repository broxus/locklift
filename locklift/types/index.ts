import { AbiFunction, KeyPair, ResultOfProcessMessage, DecodedMessageBody } from '@tonclient/core';
import BigNumber from 'bignumber.js';

export type ValueOf<T> = T[keyof T];

export type Bytes = ArrayLike<number>;

export type BytesLike = string | Bytes;

export type RunContractParams<P> = {
  method: string;
  params?: P | any;
  keyPair?: KeyPair;
}

interface ResultOfProcessMessageGeneric<O> extends ResultOfProcessMessage {
  decoded?: {
    out_messages: DecodedMessageBody | null[];
    output?: O
  }
}

export { ResultOfProcessMessageGeneric as ResultOfProcessMessage };

export interface ContractMethod<P> {
  /**
   * Run smart contract method. Create run message and wait for transaction.
   *
   * @param args
   */
  run(args: Omit<RunContractParams<P>, 'method'>): Promise<ResultOfProcessMessage>;

  /**
   * Call smart contract method. Uses runLocal to run TVM code locally and decodes result
   * according to the ABI.
   *
   * @param args
   */
  call(args: Omit<RunContractParams<P>, 'method'>): Promise<any>;
}

export type ContractFunctions = Record<string, Omit<AbiFunction, 'name'>>;

export { BigNumber };

export {
  CreateDeployMessageParams,
  CreateRunMessageParams,
  AccountType,
} from '../ton';
