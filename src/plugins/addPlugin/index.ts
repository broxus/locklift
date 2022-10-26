import { Extender } from "../types";

export const addPlugin = (extender: Extender) => {
  global.extenders.push(extender);
};
