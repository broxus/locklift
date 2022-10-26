import fs from "fs";
import { DirectoryTree } from "directory-tree";
import { LockliftConfig } from "../../config";
import { BuilderConfig } from "./index";
import { ComponentType } from "../../compilerComponentsStore/constants";
import { getComponent } from "../../compilerComponentsStore";
import * as Buffer from "buffer";
import { ExecErrorOutput } from "./types";
import {
  execSync,
  ExecSyncOptions,
  ExecSyncOptionsWithBufferEncoding,
  ExecSyncOptionsWithStringEncoding,
} from "child_process";
import { resolve } from "path";

export function checkDirEmpty(dir: fs.PathLike): fs.PathLike | boolean {
  if (!fs.existsSync(dir)) {
    return dir;
  }
  return fs.readdirSync(dir).length === 0;
}

export function flatDirTree(tree: DirectoryTree): DirectoryTree[] | undefined {
  return tree.children?.reduce((acc: DirectoryTree[], current: DirectoryTree) => {
    if (current.children === undefined) {
      return [...acc, current];
    }

    const flatChild = flatDirTree(current);

    if (!flatChild) return acc;

    return [...acc, ...flatChild];
  }, []);
}

export const compilerConfigResolver = async ({
  compiler,
  linker,
}: Pick<LockliftConfig, "compiler" | "linker">): Promise<BuilderConfig> => {
  const builderConfig: BuilderConfig = {
    includesPath: compiler.includesPath,
    externalContracts: compiler.externalContracts,
  } as BuilderConfig;
  if ("path" in compiler) {
    builderConfig.compilerPath = compiler.path;
  }
  if ("version" in compiler) {
    builderConfig.compilerPath = await getComponent({
      component: ComponentType.COMPILER,
      version: compiler.version,
    });
  }
  if ("path" in linker) {
    builderConfig.linkerPath = linker.path;
    builderConfig.linkerLibPath = linker.lib;
  }
  if ("version" in linker) {
    if (!("version" in compiler)) {
      throw new Error("You can't provide linker version without compiler version!");
    }
    builderConfig.linkerPath = await getComponent({
      version: linker.version,
      component: ComponentType.LINKER,
    });
    builderConfig.linkerLibPath = await getComponent({
      version: compiler.version,
      component: ComponentType.LIB,
    });
  }
  return builderConfig;
};

export const tvcToBase64 = (tvc: Buffer) => tvc.toString("base64");

export const extractContractName = (pathToFile: string): string =>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  pathToFile.match(new RegExp("contracts(.*).sol"))![1].slice(1);

export function execSyncWrapper(command: string): Buffer;
export function execSyncWrapper(command: string, options: ExecSyncOptionsWithStringEncoding): string;
export function execSyncWrapper(command: string, options: ExecSyncOptionsWithBufferEncoding): Buffer;
export function execSyncWrapper(command: string, options?: ExecSyncOptions): string | Buffer {
  try {
    return execSync(command, options);
  } catch (err) {
    const ioError: ExecErrorOutput = err as ExecErrorOutput;
    throw new Error(`${ioError.toString()}stdout: ${ioError.stdout.toString()}`);
  }
}
export const tryToGetNodeModules = (): string | undefined => {
  try {
    return resolve(require.resolve("locklift/package.json"), "../../");
  } catch (e) {
    return undefined;
  }
};

export const isValidCompilerOutputLog = (output: string): boolean =>
  !!output.trim() && output.trim() !== "Compiler run successful, no output requested.";
