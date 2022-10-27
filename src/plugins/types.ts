import { Locklift, LockliftConfig } from "../index";
import { ConfigState } from "../internal/config";
import commander from "commander";

export type Extender = {
  pluginName: string;
  initializer?: (params: {
    locklift: Locklift<any>;
    config: LockliftConfig<ConfigState.INTERNAL>;
    network: keyof LockliftConfig["networks"];
  }) => Promise<any>;
  skipSteps?: {
    build?: boolean;
  };
  commandBuilders?: Array<(command: commander.Command) => commander.Command>;
};

export type ExtenderActionParams = {
  config: () => LockliftConfig;
  locklift: Locklift<any>;
  script?: string;
  build?: string;
  network: string;
  contracts?: string;
};
