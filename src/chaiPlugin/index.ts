import { supportEmit } from "./matchers/emit";

export const lockliftChai = (chai: Chai.ChaiStatic /*_: Chai.ChaiUtils*/) => {
  supportEmit(chai.Assertion);
};
