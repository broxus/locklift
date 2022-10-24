import { Extender } from "./plugins/types";

export declare global {
  declare namespace globalThis {
    /* eslint no-var: off */
    var extenders: Array<Extender>;
  }
}
