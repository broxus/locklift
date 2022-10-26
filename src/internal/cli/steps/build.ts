import fs from "fs-extra";
import { Builder } from "../builder";
import { compilerConfigResolver } from "../builder/utils";
import { ConfigState, LockliftConfig } from "../../config";

export const buildStep = async (
  config: LockliftConfig<ConfigState.INTERNAL>,
  options: {
    build: string;
    contracts: string;
    disableIncludePath: boolean;
  } & Pick<LockliftConfig, "compiler" | "linker">,
) => {
  fs.ensureDirSync(options.build);
  const builder = new Builder(await compilerConfigResolver(config), {
    build: options.build,

    disableIncludePath: options.disableIncludePath,
    contracts: options.contracts,
  });

  const status = await builder.buildContracts();

  if (!status) process.exit(1);
};
