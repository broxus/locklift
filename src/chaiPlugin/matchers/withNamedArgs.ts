import { ViewTrace } from "src/tracing/types";

import { mapAddressesToString, objectIntersection } from "../utils";

/**
 * Used for testing the arguments of events or custom errors, naming the arguments.
 * Can test the subset of all arguments.
 * Should be used after .emit matcher.
 */
export function supportWithNamedArgs(Assertion: Chai.AssertionStatic, utils: Chai.ChaiUtils) {
  Assertion.addMethod("withNamedArgs", function (this: any, expectedArgs: Record<string, unknown>, isPartial = true) {
    const events = utils.flag(this, "messages") as ViewTrace<string, unknown>[];
    const firstEvent = events[0];
    if (!firstEvent.decodedMsg?.params) {
      throw new Error(`Event ${firstEvent.decodedMsg?.method} doesn't have params`);
    }
    const { eventParamsWithUpdatedAddress, expectedArgsWithUpdatedAddress } = {
      eventParamsWithUpdatedAddress: mapAddressesToString(firstEvent.decodedMsg.params),
      expectedArgsWithUpdatedAddress: mapAddressesToString(expectedArgs),
    };
    if (isPartial) {
      const partialEventArgs = objectIntersection(eventParamsWithUpdatedAddress, expectedArgsWithUpdatedAddress);
      new Assertion(partialEventArgs).to.be.deep.equal(expectedArgsWithUpdatedAddress, "Not partial equals");
      return this;
    }
    new Assertion(eventParamsWithUpdatedAddress).to.be.deep.equal(expectedArgsWithUpdatedAddress, "Not equals");
    return this;
  });
}
