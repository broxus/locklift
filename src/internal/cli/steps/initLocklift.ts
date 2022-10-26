import { Locklift, LockliftConfig } from "../../../index";
import path from "path";
import { ConfigState } from "../../config";
import * as tsNode from "ts-node";

export const initLockliftStep = async (
  config: LockliftConfig<ConfigState.INTERNAL>,
  options: { network: string; script: string },
): Promise<Locklift<any>> => {
  // Initialize Locklift
  //@ts-ignore
  global.locklift = await Locklift.setup(config, options.network);
  global.__dirname = __dirname;
  process.env.TS_CONFIG_PATHS = path.resolve(process.cwd(), "tsconfig.json");
  if (process.env.TS_CONFIG_PATHS) {
    require("tsconfig-paths/register");
  }
  await tsNode.register({
    project: process.env.TS_CONFIG_PATHS,
    files: false,
    transpileOnly: true,
  });
  //@ts-ignore

  return global.locklift;
  // require(path.resolve(process.cwd(), options.script));
};
