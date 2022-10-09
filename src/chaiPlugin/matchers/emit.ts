import { ViewTracingTree } from "../../tracing/viewTraceTree/viewTracingTree";
import { TraceType } from "../../tracing/types";
import AssertionStatic = Chai.AssertionStatic;
import { supportWithNamedArgs } from "./withArgs";
import { Address, Contract } from "everscale-inpage-provider";
import { supportWithCount } from "./count";

export const supportEmit = (Assertion: Chai.AssertionStatic) => {
  Assertion.addMethod("emit", function (this: AssertionStatic, eventName: string, contract?: Contract<any> | Address) {
    const rewriteThis: AssertionStatic & { __flags: { negate: boolean; object: ViewTracingTree } } =
      this as AssertionStatic & { __flags: { negate: boolean; object: ViewTracingTree } };
    const viewTracingTree = rewriteThis.__flags.object;
    const events = getEvents({
      contract,
      viewTracingTree,
      eventName,
    });
    this.assert(
      events.length > 0,
      `Expected event "${eventName}" to be emitted, but it wasn't`,
      `Expected event "${eventName}" NOT to be emitted, but it was`,
      true,
    );
    //@ts-ignore
    this.events = events;
    return this;
  });
  supportWithNamedArgs(Assertion);
  supportWithCount(Assertion);
};

const getEvents = ({
  viewTracingTree,
  contract,
  eventName,
}: {
  viewTracingTree: ViewTracingTree;
  contract?: Contract<any> | Address;
  eventName: string;
}) => {
  return viewTracingTree
    .findByTypeWithFullData({ type: TraceType.EVENT, name: eventName })
    .filter(event => event.decodedMsg?.method === eventName)
    .filter(event => {
      if (!contract) {
        return true;
      }
      return contract instanceof Address
        ? event.contract.contract.address.equals(contract)
        : contract.address.equals(event.contract.contract.address);
    });
};
