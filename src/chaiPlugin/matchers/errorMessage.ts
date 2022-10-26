import { ViewTracingTree } from "../../internal/tracing/viewTraceTree/viewTracingTree";

import { Address, Contract } from "everscale-inpage-provider";

import AssertionStatic = Chai.AssertionStatic;

export const supportMessageErrors = (Assertion: Chai.AssertionStatic, utils: Chai.ChaiUtils) => {
  Assertion.addMethod(
    "error",
    function (this: AssertionStatic, errorCode?: number | null, contract?: Contract<any> | Address | string) {
      const rewriteThis: AssertionStatic & { __flags: { object: ViewTracingTree } } = this as AssertionStatic & {
        __flags: { negate: boolean; object: ViewTracingTree };
      };
      const viewTracingTree = rewriteThis.__flags.object;

      const errors = contract
        ? viewTracingTree.getErrorsByContract(contract)?.map(error => ({ ...error, contract })) || []
        : viewTracingTree.getAllErrors();

      if (errorCode !== null && typeof errorCode !== "number") {
        this.assert(
          errors.length > 0,
          "Expected errors to be through, but it wasn't",
          `Expected errors NOT to be through, but it was \n ${JSON.stringify(
            errors.map(({ trace, contract, ...rest }) => ({
              ...rest,
              contract: `${trace.contract.name}(${contract})`,
              method: `${trace.decodedMsg?.method}(${JSON.stringify(trace.decodedMsg?.params)})`,
            })),
            null,
            4,
          )}`,
          true,
        );
      } else {
        this.assert(
          errors.filter(({ code }) => code === errorCode).length > 0,
          `Expected error "${errorCode}" to be thrown, but it wasn't`,
          `Expected error "${errorCode}" NOT to be thrown, but it was`,
          true,
        );
      }

      utils.flag(this, "errors", errors);
      return this;
    },
  );
};
