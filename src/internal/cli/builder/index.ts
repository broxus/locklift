import { LockliftConfig } from "../../config";
import { exec, execSync } from "child_process";
import { copyExternalArtifacts, typeGenerator } from "../../generators";
import ejs from "ejs";
import fs from "fs";
import path, { resolve, parse } from "path";
import _ from "underscore";
import {
  execSyncWrapper,
  extractContractName,
  isValidCompilerOutputLog,
  resolveExternalContracts,
  tryToGetNodeModules,
  tvcToBase64,
} from "./utils";

const tablemark = require("tablemark");
import { ParsedDoc } from "../types";
import { promisify } from "util";
import { catchError, concat, defer, filter, from, lastValueFrom, map, mergeMap, tap, throwError, toArray } from "rxjs";
import { logger } from "../../logger";
import semver from "semver/preload";
import { getContractsTree } from "../../utils";
import { BuildCache } from "../../buildCache";

export type BuilderConfig = {
  includesPath?: string;
  compilerPath: string;
  linkerLibPath: string;
  linkerPath: string;
  compilerParams?: Array<string>;
  externalContracts: LockliftConfig["compiler"]["externalContracts"];
  externalContractsArtifacts: LockliftConfig["compiler"]["externalContractsArtifacts"];
};
type Option = {
  build: string;
  disableIncludePath: boolean;
  contracts: string;
  force: boolean;
  externalAbiFiles?: Array<string>;
};
export class Builder {
  private options: Option;
  private nameRegex = /======= (?<contract>.*) =======/g;
  private docRegex = /(?<doc>^{(\s|.)*?^})/gm;

  constructor(private readonly config: BuilderConfig, options: Option, private readonly compilerVersion: string) {
    this.options = options;
  }

  static create(config: BuilderConfig, options: Option): Builder {
    const matchedCompilerVersion = execSync(config.compilerPath + " --version")
      .toString()
      .trim()
      .match(/(?<=Version: )(.*)(?=\+commit)/);

    if (!matchedCompilerVersion) {
      throw new Error("Cannot get compiler version");
    }
    return new Builder(config, options, matchedCompilerVersion[0]);
  }

  async buildContracts(): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const contractsTree = getContractsTree(this.options.contracts)!;

    const { contractArtifacts, contractsToBuild: externalContracts } = await resolveExternalContracts(
      this.config.externalContracts,
    );
    const totalContracts = [...contractsTree.map(el => el.path), ...externalContracts];

    const buildCache = new BuildCache(totalContracts, this.options.force, this.options.build);

    const contractsToBuild = await buildCache.buildTree();

    logger.printInfo(`Found ${totalContracts.length} sources`);
    if (contractsToBuild.length > 0) {
      logger.printInfo(`Found ${contractsToBuild.length} changes, compiling...`);
      try {
        await this.compileContracts(contractsToBuild);
        logger.printInfo("Built");
        buildCache.applyCurrentCache();
      } catch (err) {
        if (err) {
          logger.printError(err);
        }
        return false;
      }
    } else {
      logger.printInfo("No changes found, skip compilation");
    }

    if (contractArtifacts.length > 0) {
      contractArtifacts.forEach(artifact =>
        fs.copyFileSync(artifact, resolve(this.options.build, path.basename(artifact))),
      );
    }

    if (this.config.externalContractsArtifacts) {
      copyExternalArtifacts(this.config.externalContractsArtifacts, this.options.build);
    }
    typeGenerator(this.options.build, ...(this.options.externalAbiFiles || []));
    logger.printInfo("factorySource generated");
    return true;
  }
  private compileContracts(contractsToBuild: Array<string>) {
    return lastValueFrom(
      from(contractsToBuild).pipe(
        map(el => ({ path: resolve(el) })),
        map(el => ({
          ...el,
          contractFileName: extractContractName(el.path),
        })),

        mergeMap(({ path, contractFileName }) => {
          const nodeModules = tryToGetNodeModules();
          return defer(async () => {
            if (semver.lte(this.compilerVersion, "0.66.0")) {
              const additionalIncludesPath = `--include-path ${resolve(process.cwd(), "node_modules")}  ${
                nodeModules ? `--include-path ${nodeModules}` : ""
              }`;
              const includePath = `${additionalIncludesPath}`;
              const execCommand = `cd ${this.options.build} && \
          ${this.config.compilerPath} ${!this.options.disableIncludePath ? includePath : ""} ${path} ${(
                this.config.compilerParams || []
              ).join(" ")}`;
              return promisify(exec)(execCommand);
            }

            if (semver.gte(this.compilerVersion, "0.68.0")) {
              const additionalIncludesPath = `${nodeModules ? `--include-path ${nodeModules}` : ""}`;
              const includePath = `${additionalIncludesPath} ${"--base-path"} . `;
              const execCommand = ` ${this.config.compilerPath} ${
                !this.options.disableIncludePath ? includePath : ""
              } -o ${this.options.build}  ${path} ${(this.config.compilerParams || []).join(" ")}`;
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
              logger.printError(
                `path: ${path}, contractFile: ${contractFileName} error: ${e?.stderr?.toString() || e}`,
              );
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
          const lib = this.config.linkerLibPath ? ` --lib ${this.config.linkerLibPath} ` : "";
          const resolvedPathCode = resolve(this.options.build, `${contractFileName}.code`);
          const resolvedPathAbi = resolve(this.options.build, `${contractFileName}.abi.json`);
          const resolvedPathMap = resolve(this.options.build, `${contractFileName}.map.json`);
          return defer(async () => {
            const command = `${
              this.config.linkerPath
            } compile "${resolvedPathCode}" -a "${resolvedPathAbi}" -o ${resolve(
              this.options.build,
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
                    resolve(this.options.build, `${contractFileName}.base64`),
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
  }

  buildDocs(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const contractsTree = getContractsTree(this.options.contracts)!;

    try {
      logger.printInfo(`Found ${contractsTree.length} sources`);

      let docs: ParsedDoc[] = [];
      contractsTree.map(({ path }) => {
        logger.printInfo(`Building ${path}`);

        const output = execSyncWrapper(
          //@ts-ignore
          `cd ${this.options.build} && ${this.config.compilerPath} ./../${path} --${this.options.mode}`,
        );

        logger.printInfo(`Compiled ${path}`);

        docs = [...docs, ...this.parseDocs(output.toString())];
      });

      // Filter duplicates by (path, name)
      docs = docs.reduce((acc: ParsedDoc[], doc: ParsedDoc) => {
        if (acc.find(({ path, name }) => path === doc.path && name === doc.name)) {
          return acc;
        }

        return [...acc, doc];
      }, []);

      // Sort docs by name (A-Z)
      docs = docs.sort((a, b) => (a.name < b.name ? -1 : 1));

      // Save docs in markdown format
      const render = ejs.render(
        fs.readFileSync(resolve(__dirname, "./../templates/index.ejs")).toString(),
        {
          docs,
          tablemark,
        },
        {
          rmWhitespace: true,
        },
      );
      //@ts-ignore
      fs.writeFileSync(
        //@ts-ignore
        resolve(process.cwd(), this.options.docs, "index.md"),
        render,
      );

      logger.printInfo("Docs generated successfully!");
    } catch (e) {
      logger.printError(e);
      return false;
    }

    return true;
  }

  private parseDocs(output: string): ParsedDoc[] {
    const contracts = [...output.matchAll(this.nameRegex)]
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .map(m => m.groups!.contract)
      // For the target contracts compiler returns relative path
      // and for dependency contracts paths are absolute
      // Make them all absolute
      .map(c => resolve(process.cwd(), this.options.build, c));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const docs = [...output.matchAll(this.docRegex)].map(m =>
      //@ts-ignore
      JSON.parse(m.groups?.doc),
    );

    return _.zip(contracts, docs).reduce((acc: ParsedDoc[], [contract, doc]: string[]) => {
      const [path, name] = contract.split(":");

      // Check name matches the "include" pattern and contract is located in the "contracts" dir
      if (
        //@ts-ignore
        name.match(new RegExp(this.options.include)) !== null &&
        path.startsWith(`${process.cwd()}/${this.options.contracts}`)
      ) {
        return [
          ...acc,
          {
            path: path.replace(`${process.cwd()}/`, ""),
            name,
            doc,
          },
        ];
      }

      return acc;
    }, []);
  }
}
