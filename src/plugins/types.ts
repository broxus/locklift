import { Locklift, LockliftConfig } from "../index";
import { ConfigState } from "../internal/config";
import commander from "commander";

export type Extender = {
  pluginName: string;
  initializer?: (params: {
    locklift: Locklift<any>;
    config: LockliftConfig<ConfigState.INTERNAL>;
    network?: keyof LockliftConfig["networks"];
  }) => Promise<any>;
  commandBuilders?: Array<{
    commandCreator: (command: commander.Command) => commander.Command;
    skipSteps?: {
      build?: boolean;
    };
  }>;
};

export type ExtenderActionParams = {
  config: () => LockliftConfig;
  locklift: Locklift<any>;
  script?: string;
  build?: string;
  network: string;
  contracts?: string;
};
