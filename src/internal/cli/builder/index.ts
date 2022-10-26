import { LockliftConfig } from "../../config";
import { exec } from "child_process";
import { copyExternalFiles, typeGenerator } from "../../generators";
import ejs from "ejs";
import fs from "fs";
import { resolve, parse } from "path";
import _ from "underscore";
import dirTree from "directory-tree";
import {
  execSyncWrapper,
  extractContractName,
  flatDirTree,
  isValidCompilerOutputLog,
  tryToGetNodeModules,
  tvcToBase64,
} from "./utils";

const tablemark = require("tablemark");
import { ParsedDoc } from "../types";
import { promisify } from "util";
import { catchError, concat, defer, filter, from, map, mergeMap, tap, throwError, toArray } from "rxjs";
import { logger } from "../../logger";

export type BuilderConfig = {
  includesPath?: string;
  compilerPath: string;
  linkerLibPath: string;
  linkerPath: string;
  externalContracts: LockliftConfig["compiler"]["externalContracts"];
};
type Option = {
  build: string;
  disableIncludePath: boolean;
  contracts: string;
};
export class Builder {
  private options: Option;
  private nameRegex = /======= (?<contract>.*) =======/g;
  private docRegex = /(?<doc>^{(\s|.)*?^})/gm;

  constructor(private readonly config: BuilderConfig, options: Option) {
    this.options = options;
  }

  async buildContracts(): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const contractsTree = this.getContractsTree()!;

    try {
      logger.printInfo(`Found ${contractsTree.length} sources`);
      await from(contractsTree)
        .pipe(
          map(el => ({ ...el, path: resolve(el.path) })),
          map(el => ({
            ...el,
            contractFileName: extractContractName(el.path),
          })),

          mergeMap(({ path, contractFileName }) => {
            const nodeModules = tryToGetNodeModules();
            const additionalIncludesPath = `--include-path ${resolve(process.cwd(), "node_modules")}  ${
              nodeModules ? `--include-path ${nodeModules}` : ""
            }`;
            const includePath = `${additionalIncludesPath}`;
            return defer(async () =>
              promisify(exec)(`cd ${this.options.build} && \
          ${this.config.compilerPath} ${!this.options.disableIncludePath ? includePath : ""} ${path}`),
            ).pipe(
              map(output => ({
                output,
                contractFileName: parse(contractFileName).name,
                path,
              })),
            );
          }),
          //Warnings
          tap(
            output =>
              isValidCompilerOutputLog(output.output.stderr.toString()) &&
              logger.printBuilderLog(output.output.stderr.toString()),
          ),
          //Errors
          catchError(e => {
            logger.printError(e?.stderr?.toString() || e);
            return throwError(undefined);
          }),
          filter(({ output }) => {
            //Only contracts
            return !!output?.stdout.toString();
          }),
          mergeMap(({ contractFileName }) => {
            const lib = this.config.linkerLibPath ? ` --lib ${this.config.linkerLibPath} ` : "";
            const resolvedPathCode = resolve(this.options.build, `${contractFileName}.code`);
            const resolvedPathAbi = resolve(this.options.build, `${contractFileName}.abi.json`);
            return defer(async () =>
              promisify(exec)(`${this.config.linkerPath} compile "${resolvedPathCode}" -a "${resolvedPathAbi}" ${lib}`),
            ).pipe(
              map(tvmLinkerLog => {
                return tvmLinkerLog.stdout.toString().match(new RegExp("Saved contract to file (.*)"));
              }),
              catchError(e => {
                logger.printError(e?.stderr?.toString());
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
                  defer(() => promisify(fs.rename)(tvcFile, resolve(this.options.build, `${contractFileName}.tvc`))),
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
          tap(() => {
            if (this.config.externalContracts) {
              copyExternalFiles(this.config.externalContracts, this.options.build);
            }
          }),
          tap(() => typeGenerator(this.options.build)),
          tap(() => logger.printInfo("factorySource generated")),
        )
        .toPromise();
      logger.printInfo("Built");
    } catch (err) {
      if (err) {
        logger.printError(err);
      }
      return false;
    }
    return true;
  }

  buildDocs(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const contractsTree = this.getContractsTree()!;

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

  private getContractsTree() {
    const contractsNestedTree = dirTree(this.options.contracts, {
      extensions: /\.sol/,
    });

    return flatDirTree(contractsNestedTree);
  }
}
