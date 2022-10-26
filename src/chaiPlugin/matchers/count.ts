import { ViewTrace } from "src/internal/tracing/types";

export function supportWithCount(Assertion: Chai.AssertionStatic, utils: Chai.ChaiUtils) {
  Assertion.addMethod("count", function (this: any, count: number) {
    const events = utils.flag(this, "messages") as ViewTrace<string, unknown>[];

    new Assertion(events.length).to.be.eq(count);
    return this;
  });
}
