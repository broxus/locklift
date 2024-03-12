import fs from "fs";
import { DirectoryTree } from "directory-tree";
import { ExternalContracts, LockliftConfig } from "../../config";
import { BuilderConfig } from "./index";
import { ComponentType } from "../../compilerComponentsStore/constants";
import { getComponent } from "../../compilerComponentsStore";
import * as Buffer from "buffer";
import { ExecErrorOutput } from "./types";
import {
  exec,
  execSync,
  ExecSyncOptions,
  ExecSyncOptionsWithBufferEncoding,
  ExecSyncOptionsWithStringEncoding,
} from "child_process";
import path, { parse, resolve } from "path";
import { promisify } from "util";
import { logger } from "../../logger";
import { catchError, concat, defer, filter, from, lastValueFrom, map, mergeMap, tap, throwError, toArray } from "rxjs";
import semver from "semver/preload";

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
    compilerParams: compiler.compilerParams,
    externalContractsArtifacts: compiler.externalContractsArtifacts,
  } as BuilderConfig;
  if ("path" in compiler) {
    builderConfig.compilerPath = compiler.path;
  }
  if ("version" in compiler) {
    if (semver.lte(compiler.version, "0.71.0")) {
      builderConfig.compilerPath = await getComponent({
        component: ComponentType.COMPILER,
        version: compiler.version,
      });
      builderConfig.mode = "solc";
    }
    if (semver.gte(compiler.version, "0.72.0")) {
      builderConfig.compilerPath = await getComponent({
        component: ComponentType.SOLD_COMPILER,
        version: compiler.version,
      });
      builderConfig.mode = "sold";
    }
  }
  if (linker && "path" in linker) {
    builderConfig.linkerPath = linker.path;
    builderConfig.linkerLibPath = linker.lib;
  }
  if (linker && "version" in linker) {
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
  const findNodeModules = require("find-node-modules");

  try {
    return resolve(findNodeModules()[0]);
  } catch (e) {
    return undefined;
  }
};

export const isValidCompilerOutputLog = (output: string): boolean =>
  !!output.trim() && output.trim() !== "Compiler run successful, no output requested.";
export const resolveExternalContracts = async (externalContracts?: ExternalContracts) => {
  return Promise.all(
    Object.entries(externalContracts || {}).map(async ([pathToFolder, contractsNames]) => {
      const folderFiles = await promisify(fs.readdir)(pathToFolder).catch(() => {
        throw new Error(`Cannot read folder ${pathToFolder} that was provided in config.externalContracts`);
      });
      const contractsArtifacts = folderFiles
        .filter(file => contractsNames.some(contract => contract === file.split(".")[0]))
        .filter(file => file.endsWith(".abi.json") || file.endsWith(".tvc") || file.endsWith(".base64"))
        .map(file => path.join(pathToFolder, file));
      if (contractsArtifacts.length > 0) {
        logger.printWarn(
          `config.compiler.externalContracts WARNING: Folder ${pathToFolder} contains contract artifacts, but this is deprecated, please use config.compiler.externalContractsArtifacts instead`,
        );
      }
      const contractFiles = folderFiles
        .filter(file => file.endsWith(".tsol") || file.endsWith(".sol"))
        .filter(file => contractsNames.some(contract => contract === file.split(".")[0]))
        .map(file => path.join(pathToFolder, file));
      return {
        contractsArtifacts,
        contractFiles,
      };
    }),
  ).then(contractsAndArtifacts =>
    contractsAndArtifacts.reduce(
      (acc, { contractsArtifacts, contractFiles }) => {
        return {
          contractsToBuild: [...acc.contractsToBuild, ...contractFiles],
          contractArtifacts: [...acc.contractArtifacts, ...contractsArtifacts],
        };
      },
      { contractArtifacts: [] as string[], contractsToBuild: [] as string[] },
    ),
  );
};

export const compileBySolC = async ({
  contracts,
  compilerVersion,
  buildFolder,
  disableIncludePath,
  compilerPath,
  compilerParams,
  linkerLibPath,
  linkerPath,
}: {
  contracts: Array<{ path: string; contractFileName: string }>;
  compilerVersion: string;
  buildFolder: string;
  disableIncludePath: boolean;
  compilerPath: string;
  compilerParams?: string[];
  linkerLibPath: string;
  linkerPath: string;
}) => {
  await lastValueFrom(
    from(contracts).pipe(
      mergeMap(({ path, contractFileName }) => {
        const nodeModules = tryToGetNodeModules();
        return defer(async () => {
          if (semver.lte(compilerVersion, "0.66.0")) {
            const additionalIncludesPath = `--include-path ${resolve(process.cwd(), "node_modules")}  ${
              nodeModules ? `--include-path ${nodeModules}` : ""
            }`;
            const includePath = `${additionalIncludesPath}`;
            const execCommand = `cd ${buildFolder} && \
          ${compilerPath} ${!disableIncludePath ? includePath : ""} ${path} ${(compilerParams || []).join(" ")}`;
            return promisify(exec)(execCommand);
          }

          if (semver.gte(compilerVersion, "0.68.0")) {
            const additionalIncludesPath = `${nodeModules ? `--include-path ${nodeModules}` : ""}`;
            const includePath = `${additionalIncludesPath} ${"--base-path"} . `;
            const execCommand = ` ${compilerPath} ${
              !disableIncludePath ? includePath : ""
            } -o ${buildFolder}  ${path} ${(compilerParams || []).join(" ")}`;
            return promisify(exec)(execCommand);
          }
          throw new Error("Unsupported compiler version");
        }).pipe(
          map(output => ({
            output,
            contractFileName: parse(contractFileName).name,
            path,
          })),
          catchError(e => {
            logger.printError(`path: ${path}, contractFile: ${contractFileName} error: ${e?.stderr?.toString() || e}`);
            return throwError(undefined);
          }),
        );
      }),
      //Warnings
      tap(
        output =>
          isValidCompilerOutputLog(output.output.stderr.toString()) &&
          logger.printBuilderLog(output.output.stderr.toString()),
      ),

      filter(({ output }) => {
        //Only contracts
        return !!output?.stdout.toString();
      }),
      mergeMap(({ contractFileName }) => {
        const lib = linkerLibPath ? ` --lib ${linkerLibPath} ` : "";
        const resolvedPathCode = resolve(buildFolder, `${contractFileName}.code`);
        const resolvedPathAbi = resolve(buildFolder, `${contractFileName}.abi.json`);
        const resolvedPathMap = resolve(buildFolder, `${contractFileName}.map.json`);
        return defer(async () => {
          const command = `${linkerPath} compile "${resolvedPathCode}" -a "${resolvedPathAbi}" -o ${resolve(
            buildFolder,
            `${contractFileName}.tvc`,
          )} ${lib} --debug-map ${resolvedPathMap}`;

          return promisify(exec)(command);
        }).pipe(
          map(tvmLinkerLog => {
            return tvmLinkerLog.stdout.toString().match(new RegExp("Saved to file (.*)."));
          }),
          catchError(e => {
            logger.printError(`contractFileName: ${contractFileName} error:${e?.stderr?.toString()}`);
            return throwError(undefined);
          }),
          map(matchResult => {
            if (!matchResult) {
              throw new Error("Linking error, noting linking");
            }
            return matchResult[1];
          }),
          mergeMap(tvcFile => {
            return concat(
              defer(() =>
                promisify(fs.writeFile)(
                  resolve(buildFolder, `${contractFileName}.base64`),
                  tvcToBase64(fs.readFileSync(tvcFile)),
                ),
              ),
            ).pipe(
              catchError(e => {
                logger.printError(e?.stderr?.toString());
                return throwError(undefined);
              }),
            );
          }),
        );
      }),
      toArray(),
    ),
  );
};

export const compileBySolD = async ({
  contracts,
  compilerVersion,
  buildFolder,
  disableIncludePath,
  compilerPath,
  compilerParams,
}: {
  contracts: Array<{ path: string; contractFileName: string }>;
  compilerVersion: string;
  buildFolder: string;
  disableIncludePath: boolean;
  compilerPath: string;
  compilerParams?: string[];
  soldPath: string;
}) => {
  await lastValueFrom(
    from(contracts).pipe(
      mergeMap(({ path, contractFileName }) => {
        const nodeModules = tryToGetNodeModules();
        return defer(async () => {
          if (semver.gte(compilerVersion, "0.72.0")) {
            const additionalIncludesPath = `${nodeModules ? `--include-path ${nodeModules}` : ""}`;
            const includePath = `${additionalIncludesPath} ${"--base-path"} . `;
            const execCommand = ` ${compilerPath} ${
              !disableIncludePath ? includePath : ""
            } -o ${buildFolder}  ${path} ${(compilerParams || []).join(" ")}`;
            return promisify(exec)(execCommand);
          }

          throw new Error("Unsupported compiler version");
        }).pipe(
          map(output => ({
            output,
            contractFileName: parse(contractFileName).name,
            path,
          })),
          catchError(e => {
            logger.printError(`path: ${path}, contractFile: ${contractFileName} error: ${e?.stderr?.toString() || e}`);
            return throwError(undefined);
          }),
        );
      }),
      //Warnings
      tap(
        output =>
          isValidCompilerOutputLog(output.output.stderr.toString()) &&
          logger.printBuilderLog(output.output.stderr.toString()),
      ),
      toArray(),
    ),
  );
};
