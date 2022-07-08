import { AbiFunction, KeyPair, ResultOfProcessMessage } from '@tonclient/core';

export type ValueOf<T> = T[keyof T];

export type Bytes = ArrayLike<number>;

export type BytesLike = string | Bytes;

export type RunContractParams<P> = {
  method: string;
  params?: P;
  keyPair?: KeyPair;
}

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

export type ContractFunctions = Record<string, Omit<AbiFunction, 'name'>>
