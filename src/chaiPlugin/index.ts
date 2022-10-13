import { supportEmitAndCall } from "./matchers/emitAndCall";
import { supportMessageErrors } from "./matchers/errorMessage";

export const lockliftChai = (chai: Chai.ChaiStatic, utils: Chai.ChaiUtils) => {
  supportEmitAndCall(chai.Assertion, utils);
  supportMessageErrors(chai.Assertion, utils);
};
