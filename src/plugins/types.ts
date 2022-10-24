import { Locklift, LockliftConfig } from "../index";
import { ConfigState } from "../internal/config";
import commander from "commander";

export type Extender = {
  pluginName: string;
  initializer?: (params: {
    locklift: Locklift<any>;
    config: LockliftConfig<ConfigState.INTERNAL>;
    network: keyof LockliftConfig["networks"];
  }) => Promise<void>;
  skipSteps?: {
    build?: boolean;
  };
  commandBuilders?: Array<(command: commander.Command) => commander.Command>;
};
