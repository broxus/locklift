import { ViewTrace } from "src/tracing/types";
import _ from "lodash";
import { Address } from "everscale-inpage-provider";

/**
 * Used for testing the arguments of events or custom errors, naming the arguments.
 * Can test the subset of all arguments.
 * Should be used after .emit matcher.
 */
export function supportWithNamedArgs(Assertion: Chai.AssertionStatic) {
  Assertion.addMethod("withNamedArgs", function (this: any, expectedArgs: Record<string, unknown>, isPartial = false) {
    const { events } = this as { events: ViewTrace<string, unknown>[] };
    const firstEvent = events[0];
    if (!firstEvent.decodedMsg?.params) {
      throw new Error(`Event ${firstEvent.decodedMsg?.method} doesn't have params`);
    }
    const eventParams = firstEvent.decodedMsg?.params;

    if (isPartial) {
      const intersectedKeys = _.intersectionWith(
        Object.keys(eventParams),
        Object.keys(expectedArgs),
        (evtKey, expectedArgKey) => expectedArgKey === evtKey,
      );

      new Assertion(mapAddressesToString(_(eventParams).pick(intersectedKeys))).to.be.deep.equal(
        mapAddressesToString(expectedArgs),
        "Not partial equals",
      );
      return this;
    }
    new Assertion(mapAddressesToString(firstEvent.decodedMsg.params)).to.be.deep.equal(
      mapAddressesToString(expectedArgs),
      "Not equals",
    );
    return this;
  });
}

const mapAddressesToString = (obj: Record<any, any> | Array<any>): Record<any, any> => {
  const mapFn = (value: any) => {
    if (Array.isArray(value)) {
      return mapAddressesToString(value);
    }
    if (value instanceof Address) {
      return value.toString();
    }
    if (typeof value === "object") {
      return mapAddressesToString(value);
    }
    return value;
  };
  if (Array.isArray(obj)) {
    return obj.map(mapFn);
  }
  return _(obj).mapValues(mapFn).value();
};
