import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
const DEFAULT_CONFIG_PATH = "locklift.config.ts";

export const tryToAttachEntryFile = (): void => {
  const { config } = yargs(hideBin(process.argv)).argv as { config?: string };
  const pathToEntryFile = path.resolve(process.cwd(), config || DEFAULT_CONFIG_PATH);
  try {
    require(pathToEntryFile);
  } catch (e) {
    return;
  }
};
