import { ProviderRpcClient } from "everscale-inpage-provider";
import { AllowedCodes, TraceParams } from "./types";
import { Factory } from "../factory";
import { TracingInternal } from "./tracingInternal";
import { extractTransactionFromParams, Transactions } from "../utils";
import { TransactionParameter } from "../types";

export class Tracing {
  constructor(
    private readonly ever: ProviderRpcClient,
    private readonly tracingInternal: TracingInternal,
    private readonly features: Transactions,
  ) {}
  public trace = async <T extends TransactionParameter>(
    transactionProm: Promise<T>,
    config: Omit<TraceParams, "inMsgId">,
  ): Promise<T> => {
    return this.features
      .waitFinalized(transactionProm)
      .then(transaction =>
        this.tracingInternal
          .trace({ inMsgId: extractTransactionFromParams(transaction).inMessage.hash, ...config })
          .then(() => transaction),
      );
  };
  public get allowedCodes(): AllowedCodes {
    return this.tracingInternal.allowedCodes;
  }
  public setAllowCodes = (params: Parameters<typeof this.tracingInternal.setAllowCodes>) =>
    this.tracingInternal.setAllowCodes(...params);
  public allowCodesForAddress = (params: Parameters<typeof this.tracingInternal.allowCodesForAddress>) =>
    this.tracingInternal.allowCodesForAddress(...params);
  public removeAllowedCodesForAddress = (
    params: Parameters<typeof this.tracingInternal.removeAllowedCodesForAddress>,
  ) => this.tracingInternal.removeAllowedCodesForAddress(...params);
  public removeAllowedCodes = (params: Parameters<typeof this.tracingInternal.removeAllowedCodes>) =>
    this.tracingInternal.removeAllowedCodes(...params);
}

export const createTracing = ({
  ever,
  factory,
  features,
  endpoint,
}: {
  ever: ProviderRpcClient;
  factory: Factory<any>;
  features: Transactions;
  endpoint?: string;
}): Tracing => {
  const internalTracing = new TracingInternal(ever, factory, endpoint || "", !!endpoint);
  return new Tracing(ever, internalTracing, features);
};
