import { Locklift, LockliftConfig } from "../../../index";
import { ConfigState } from "../../config";

export const initLockliftStep = async (
  config: LockliftConfig<ConfigState.INTERNAL>,
  options: { network?: string; script: string },
): Promise<Locklift<any>> => {
  // Initialize Locklift
  //@ts-ignore
  global.locklift = await Locklift.setup(config, options.network);
  global.__dirname = __dirname;

  require("tsconfig-paths/register");

  //@ts-ignore
  return global.locklift;
};
