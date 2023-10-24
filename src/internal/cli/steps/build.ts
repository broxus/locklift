import fs from "fs-extra";
import { Builder } from "../builder";
import { compilerConfigResolver } from "../builder/utils";
import { ConfigState, LockliftConfig } from "../../config";
import path from "path";

export const buildStep = async (
  config: LockliftConfig<ConfigState.INTERNAL>,
  options: {
    build: string;
    contracts: string;
    disableIncludePath: boolean;
    network?: string;
  } & Pick<LockliftConfig, "compiler" | "linker">,
  isForce: boolean,
) => {
  fs.ensureDirSync(options.build);
  const forkSettings = config.networks[options.network as string]?.fork;

  const builder = Builder.create(await compilerConfigResolver(config), {
    build: options.build,

    disableIncludePath: options.disableIncludePath,
    contracts: options.contracts,
    externalAbiFiles: forkSettings?.contracts.map(({ abi }) => abi.path),
    force: isForce,
  });

  const status = await builder.buildContracts();

  if (!status) process.exit(1);
};
