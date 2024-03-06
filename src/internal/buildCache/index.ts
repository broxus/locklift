import fs from "fs-extra";
import path from "path";
import { tryToGetNodeModules } from "../cli/builder/utils";
import { tryToGetFileChangeTime } from "./utils";
import chalk from "chalk";
import { defer, from, lastValueFrom, map, mergeMap, tap, toArray } from "rxjs";
import { CacheRecord } from "./types";
import _ from "lodash";
const cacheFolder = path.join(".cache/build.json");
const importMatcher = /^\s*import\s*(?:{[^}]+}\s*from\s*)?["']([^"']+\.t?sol)["']\s*;/gm;
const artifactsExtensions = [".tvc", ".abi.json", ".code"];
export class BuildCache {
  private readonly prevCache: CacheRecord;
  private currentCache: CacheRecord = {};

  constructor(private readonly contracts: string[], isForce: boolean, private readonly buildFolder: string) {
    fs.ensureFileSync(cacheFolder);
    this.prevCache = isForce ? [] : fs.readJSONSync(cacheFolder, { throws: false }) || [];
  }
  getBuiltContracts() {
    const files = fs.readdirSync(this.buildFolder);
    return _(files)
      .groupBy(el => el.split(".")[0])
      .entries()
      .filter(([, files]) => artifactsExtensions.every(ext => files.some(file => file.endsWith(ext))))
      .map(([contractName]) => contractName)
      .value();
  }
  async buildTree() {
    const builtContracts = this.getBuiltContracts();

    const { contractsMap, contractsWithImports } = await this.findContractsAndImports(this.contracts);

    Array.from(contractsMap.keys())
      .filter(el => !builtContracts.includes(path.basename(el).split(".")[0]))
      .map(pathToContract => pathToContract)
      .forEach(el => this.removeRecordFromCache(el));

    const uniqFiles = this.getUniqueFiles(contractsWithImports);
    const filesWithModTime = this.applyModTime(uniqFiles);

    this.currentCache = filesWithModTime;
    const updatedOrNewFiles = this.getUpdatedOrNewFiles(filesWithModTime, this.prevCache);

    const importToImportersMap = contractsWithImports.reduce((acc, current) => {
      current.imports.forEach(imp => {
        acc[imp.path] = acc[imp.path] ? [...acc[imp.path], current.path] : [current.path];
      });
      return acc;
    }, {} as Record<string, string[]>);
    const printArr = [] as Array<Print>;

    return findFilesForBuildRecursive(updatedOrNewFiles, importToImportersMap, contractsMap, printArr);
  }

  async findContractsAndImports(contracts: string[]) {
    const pathToNodeModules = tryToGetNodeModules();

    const contractsMap = new Map<string, boolean>();
    const contractsWithImports = await lastValueFrom(
      from(contracts).pipe(
        mergeMap(contractPath =>
          from(
            fs.readFile(contractPath, {
              encoding: "utf-8",
            }),
          ).pipe(
            tap(contractFile => {
              if (new RegExp(/^\s*contract [A-Za-z0-9_]+\s*(is\s+[A-Za-z0-9_,\s]+)*\{/gm).test(contractFile)) {
                contractsMap.set(contractPath, true);
              }
            }),
            mergeMap(contractFile => {
              return from(Array.from(contractFile.matchAll(importMatcher))).pipe(
                map(el => el[1]),
                mergeMap(imp =>
                  defer(async () => {
                    const localImportPath = path.join(contractPath, "..", imp);
                    const localFileChangeTime = await tryToGetFileChangeTime(localImportPath);
                    if (localFileChangeTime) {
                      return {
                        path: localImportPath,
                        modificationTime: localFileChangeTime,
                      };
                    }
                    const nodeModulesImportPath = path.join(pathToNodeModules!, imp);
                    const nodeModulesFileChangeTime = await tryToGetFileChangeTime(nodeModulesImportPath);
                    if (nodeModulesFileChangeTime) {
                      return {
                        path: nodeModulesImportPath,
                        modificationTime: nodeModulesFileChangeTime,
                      };
                    }
                    throw new Error(`Can't find import ${imp} for file ${contractPath}`);
                  }),
                ),
                toArray(),
              );
            }),
            map(imports => ({ path: contractPath, imports })),
          ),
        ),
        toArray(),
      ),
    );

    return { contractsWithImports, contractsMap };
  }

  getUniqueFiles(contractsWithImports: Array<{ path: string; imports: Array<{ path: string }> }>) {
    const uniqFiles = new Set<string>();
    [
      ...contractsWithImports.map(el => el.path),
      ...contractsWithImports.flatMap(el => el.imports.map(el => el.path)),
    ].forEach(el => uniqFiles.add(el));
    return Array.from(uniqFiles);
  }
  getUpdatedOrNewFiles(filesWithModTime: CacheRecord, cache: CacheRecord) {
    return Object.entries(filesWithModTime)
      .filter(([filePath, { modificationTime }]) => {
        const prevFile = cache[filePath];
        if (!prevFile) {
          return true;
        }
        return prevFile.modificationTime !== modificationTime;
      })
      .map(([filePath]) => filePath);
  }
  applyModTime(files: string[]): CacheRecord {
    return files.reduce((acc, el) => {
      return { ...acc, [el]: { modificationTime: fs.statSync(el).mtime.getTime() } };
    }, {} as CacheRecord);
  }
  applyCurrentCache() {
    fs.writeJSONSync(cacheFolder, this.currentCache, {
      spaces: 4,
    });
  }
  applyOldCache() {
    fs.writeJSONSync(cacheFolder, this.prevCache, {
      spaces: 4,
    });
  }
  clearCache() {
    fs.writeJSONSync(cacheFolder, [], {
      spaces: 4,
    });
  }
  removeRecordFromCache(filePath: string) {
    delete this.prevCache[filePath];
    this.applyOldCache();
  }
  static clearCache() {
    fs.rmSync(cacheFolder, { recursive: true });
  }
}
type Print = { filePath: string; subDep: Array<Print> };
const recursivePrint = (printArr: Array<Print>, level = 0, selectedContracts: Array<string>) => {
  printArr.forEach(el => {
    console.log(
      `${" ".repeat(level)}${selectedContracts.includes(el.filePath) ? chalk.blueBright(el.filePath) : el.filePath}`,
    );
    recursivePrint(el.subDep, level + 1, selectedContracts);
  });
};
const findFilesForBuildRecursive = (
  updatedOrNewFiles: string[],
  importToFileMap: Record<string, Array<string>>,
  contractsMap: Map<string, boolean>,
  printArr: Array<Print>,
  visitedMap: Map<string, boolean> = new Map(),
): Array<string> => {
  return updatedOrNewFiles.reduce((acc, filePath) => {
    const importRecords = importToFileMap[filePath];
    const prevVisited = new Map(visitedMap);
    if (visitedMap.get(filePath)) {
      return acc;
    }
    visitedMap.set(filePath, true);

    /// debug
    const newPrintArr = [] as Array<Print>;
    printArr.push({ filePath, subDep: newPrintArr });

    if (!importRecords || importRecords.length === 0) {
      acc.push(filePath);

      return acc;
    }
    const notVisitedFiles = importRecords.filter(el => !prevVisited.get(el));

    if (contractsMap.get(filePath)) {
      acc.push(filePath);
    }

    return [
      ...acc,
      ...findFilesForBuildRecursive(notVisitedFiles, importToFileMap, contractsMap, newPrintArr, visitedMap),
    ];
  }, [] as string[]);
};
