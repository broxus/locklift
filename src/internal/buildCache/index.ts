import fs from "fs-extra";
import path from "path";
import { tryToGetNodeModules } from "../cli/builder/utils";
import { tryToGetFileChangeTime } from "./utils";
import chalk from "chalk";
import { defer, from, lastValueFrom, map, mergeMap, tap, toArray } from "rxjs";
import { CacheRecord } from "./types";

const importMatcher = /^\s*import\s*(?:{[^}]+}\s*from\s*)?["']([^"']+\.t?sol)["']\s*;/gm;
export class BuildCache {
  private readonly buildCacheFolder = path.join(".cache/build.json");
  private readonly prevCache: CacheRecord;
  private currentCache: CacheRecord = {};

  constructor(private readonly contracts: string[]) {
    fs.ensureFileSync(this.buildCacheFolder);
    this.prevCache = fs.readJSONSync(this.buildCacheFolder, { throws: false }) || [];
  }

  async buildTree() {
    const { contractsMap, contractsWithImports } = await this.findContractsAndImports();
    const uniqFiles = this.getUniqueFiles(contractsWithImports);
    const filesWithModTime = this.applyModTime(uniqFiles);

    this.currentCache = filesWithModTime;
    const updatedOrNewFiles = this.getUpdatedOrNewFiles(filesWithModTime);

    const importToImportersMap = contractsWithImports.reduce((acc, current) => {
      current.imports.forEach(imp => {
        acc[imp.path] = acc[imp.path] ? [...acc[imp.path], current.path] : [current.path];
      });
      return acc;
    }, {} as Record<string, string[]>);
    const printArr = [] as Array<Print>;

    return findFilesForBuildRecursive(updatedOrNewFiles, importToImportersMap, contractsMap, printArr);
  }

  async findContractsAndImports() {
    const pathToNodeModules = tryToGetNodeModules();

    const contractsMap = new Map<string, boolean>();
    const contractsWithImports = await lastValueFrom(
      from(this.contracts).pipe(
        mergeMap(el =>
          from(
            fs.readFile(el, {
              encoding: "utf-8",
            }),
          ).pipe(
            tap(contractFile => {
              if (new RegExp(/^\s*contract [A-Za-z0-9_]+\s*(is\s+[A-Za-z0-9_,\s]+)*\{/gm).test(contractFile)) {
                contractsMap.set(el, true);
              }
            }),
            mergeMap(contractFile => {
              return from(Array.from(contractFile.matchAll(importMatcher))).pipe(
                map(el => el[1]),
                mergeMap(imp =>
                  defer(async () => {
                    const localImportPath = path.join(el, "..", imp);
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
                    throw new Error(`Can't find import ${imp}`);
                  }),
                ),
                toArray(),
              );
            }),
            map(imports => ({ path: el, imports })),
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
  getUpdatedOrNewFiles(filesWithModTime: CacheRecord) {
    return Object.entries(filesWithModTime)
      .filter(([filePath, { modificationTime }]) => {
        const prevFile = this.prevCache[filePath];
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
  applyCache() {
    fs.writeJSONSync(this.buildCacheFolder, this.currentCache, {
      spaces: 4,
    });
  }
  clearCache() {
    fs.writeJSONSync(this.buildCacheFolder, [], {
      spaces: 4,
    });
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
