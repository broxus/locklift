import { ViewTrace } from "src/tracing/types";

export function supportWithCount(Assertion: Chai.AssertionStatic) {
  Assertion.addMethod("count", function (this: any, count: number) {
    const { events } = this as { events: ViewTrace<string, unknown>[] };
    new Assertion(events.length).to.be.eq(count);
    return this;
  });
}
