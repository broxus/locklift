import { ViewTracingTree } from "../../internal/tracing/viewTraceTree/viewTracingTree";
import { Addressable, TraceType } from "../../internal/tracing/types";
import { supportWithNamedArgs } from "./withNamedArgs";
import { supportWithCount } from "./count";
import { getMessage } from "../utils";
import AssertionStatic = Chai.AssertionStatic;

export const supportEmitAndCall = (Assertion: Chai.AssertionStatic, utils: Chai.ChaiUtils) => {
  Assertion.addMethod("emit", function (this: AssertionStatic, eventName: string, contract?: Addressable) {
    const rewriteThis: AssertionStatic & { __flags: { negate: boolean; object: ViewTracingTree } } =
      this as AssertionStatic & { __flags: { negate: boolean; object: ViewTracingTree } };
    const viewTracingTree = rewriteThis.__flags.object;
    const events = getMessage({
      contract,
      viewTracingTree,
      msgName: eventName,
      msgType: TraceType.EVENT,
    });
    this.assert(
      events.length > 0,
      `Expected event "${eventName}" to be emitted, but it wasn't`,
      `Expected event "${eventName}" NOT to be emitted, but it was`,
      true,
    );
    utils.flag(this, "messages", events);
    return this;
  });
  Assertion.addMethod("call", function (this: AssertionStatic, methodName: string, contract?: Addressable) {
    const rewriteThis: AssertionStatic & { __flags: { negate: boolean; object: ViewTracingTree } } =
      this as AssertionStatic & { __flags: { negate: boolean; object: ViewTracingTree } };
    const viewTracingTree = rewriteThis.__flags.object;
    const calls = getMessage({
      contract,
      viewTracingTree,
      msgName: methodName,
      msgType: TraceType.FUNCTION_CALL,
    });
    this.assert(
      calls.length > 0,
      `Expected method "${methodName}" to be called, but it wasn't`,
      `Expected method "${methodName}" NOT to be called, but it was`,
      true,
    );

    utils.flag(this, "messages", calls);

    return this;
  });
  supportWithNamedArgs(Assertion, utils);
  supportWithCount(Assertion, utils);
};
