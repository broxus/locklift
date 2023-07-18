import { ProviderRpcClient } from "everscale-inpage-provider";
import { AllowedCodes, TraceParams } from "./types";
import { Factory } from "../factory";
import { TracingInternal } from "./tracingInternal";
import { Transactions } from "../../utils";
import { TransactionParameter } from "../../types";
import { ViewTracingTree } from "./viewTraceTree/viewTracingTree";
import { TracingTransport } from "./transport";
import { LockliftNetwork } from "@broxus/locklift-network";

export class Tracing {
  constructor(
    private readonly ever: ProviderRpcClient,
    private readonly tracingInternal: TracingInternal,
    private readonly features: Transactions,
    private readonly network: LockliftNetwork,
  ) {
    this.setContractLabels = tracingInternal.setContractLabels;
  }

  public setContractLabels: TracingInternal["setContractLabels"];

  public trace = async <T extends TransactionParameter>(
    transactionProm: Promise<T> | T,
    config?: Omit<TraceParams<T>, "finalizedTx">,
  ): Promise<T & { traceTree: ViewTracingTree | undefined }> => {
    const finalizedTx = await this.features.waitFinalized(transactionProm);

    return this.tracingInternal
      .trace({ finalizedTx, ...config })
      .then(traceTree => ({ ...finalizedTx.extTransaction, traceTree: traceTree }));
  };
  public get allowedCodes(): AllowedCodes {
    return this.tracingInternal.allowedCodes;
  }
  public setAllowedCodes = (...params: Parameters<typeof this.tracingInternal.setAllowedCodes>) =>
    this.tracingInternal.setAllowedCodes(...params);
  public setAllowedCodesForAddress = (...params: Parameters<typeof this.tracingInternal.setAllowedCodesForAddress>) =>
    this.tracingInternal.setAllowedCodesForAddress(...params);
  public removeAllowedCodesForAddress = (
    ...params: Parameters<typeof this.tracingInternal.removeAllowedCodesForAddress>
  ) => this.tracingInternal.removeAllowedCodesForAddress(...params);
  public removeAllowedCodes = (...params: Parameters<typeof this.tracingInternal.removeAllowedCodes>) =>
    this.tracingInternal.removeAllowedCodes(...params);
}

export const createTracing = ({
  ever,
  factory,
  features,
  tracingTransport,
  network,
}: {
  ever: ProviderRpcClient;
  factory: Factory<any>;
  features: Transactions;
  tracingTransport: TracingTransport;
  network: LockliftNetwork;
}): Tracing => {
  const internalTracing = new TracingInternal(ever, factory, tracingTransport, network);
  return new Tracing(ever, internalTracing, features, network);
};
