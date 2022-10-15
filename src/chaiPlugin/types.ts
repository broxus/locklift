/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-use-before-define */
/// <reference types="chai" />

declare namespace Chai {
  interface Assertion extends LanguageChains, NumericComparison, TypeComparison {
    emit(eventName: string, contractOrAddress?: any): EmitAssertion;
    call(methodName: string, contractOrAddress?: any): EmitAssertion;
    error(errorCode?: number | null, contractOrAddress?: any): AsyncAssertion;
  }

  interface AsyncAssertion extends Assertion, Promise<void> {}

  interface EmitAssertion extends AsyncAssertion {
    withNamedArgs(args: Record<string, unknown>, message?: string): AsyncAssertion;
    count(count: number): EmitAssertion;
  }
}
