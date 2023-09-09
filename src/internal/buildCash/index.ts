import { DirectoryTree } from "directory-tree";
import fs from "fs-extra";
import path from "path";
import { tryToGetNodeModules } from "../cli/builder/utils";
import { tryToGetFileChangeTime } from "./utils";
import chalk from "chalk";
import { defer, from, lastValueFrom, map, mergeMap, tap, toArray } from "rxjs";
const importMatcher = /^\s*import\s*(?:{[^}]+}\s*from\s*)?["']([^"']+\.tsol)["'];/gm;
export class BuildCash {
  private readonly buildCashFolder = path.join("buildCash", "buildCash.json");
  private readonly prevCash: Record<string, { modificationTime: number }>;

  constructor(private readonly contracts: DirectoryTree<Record<string, any>>[]) {
    fs.ensureFileSync(this.buildCashFolder);
    this.prevCash = fs.readJSONSync(this.buildCashFolder, { throws: false }) || [];
  }

  async buildTree() {
    const pathToNodeModules = tryToGetNodeModules();
    const contractsMap = new Map<string, boolean>();

    const contractsWithImports = await lastValueFrom(
      from(this.contracts).pipe(
        mergeMap(el =>
          from(
            fs.readFile(el.path, {
              encoding: "utf-8",
            }),
          ).pipe(
            tap(contractFile => {
              if (new RegExp(/^contract [A-Za-z0-9_]+\s+is\s+[A-Za-z0-9_,\s]+\{/gm).test(contractFile)) {
                contractsMap.set(el.path, true);
              }
            }),
            mergeMap(contractFile => {
              return from(Array.from(contractFile.matchAll(importMatcher))).pipe(
                map(el => el[1]),
                mergeMap(imp =>
                  defer(async () => {
                    const localImportPath = path.join(el.path, "..", imp);
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
            map(imports => ({ name: el.name, path: el.path, imports })),
          ),
        ),
        toArray(),
      ),
    );
    const uniqFiles = new Set<string>();
    [
      ...contractsWithImports.map(el => el.path),
      ...contractsWithImports.flatMap(el => el.imports.map(el => el.path)),
    ].forEach(el => uniqFiles.add(el));
    const filesWithModTime = Array.from(uniqFiles).reduce((acc, el) => {
      return { ...acc, [el]: { modificationTime: fs.statSync(el).mtime.getTime() } };
    }, {} as Record<string, { modificationTime: number }>);

    fs.writeJSONSync(this.buildCashFolder, filesWithModTime, {
      spaces: 4,
    });
    const updatedOrNewFiles = Object.entries(filesWithModTime)
      .filter(([filePath, { modificationTime }]) => {
        const prevFile = this.prevCash[filePath];
        if (!prevFile) {
          return true;
        }
        return prevFile.modificationTime !== modificationTime;
      })
      .map(([filePath]) => filePath);

    const importToFileMap = contractsWithImports.reduce((acc, current) => {
      current.imports.forEach(imp => {
        acc[imp.path] = acc[imp.path] ? [...acc[imp.path], current.path] : [current.path];
      });
      return acc;
    }, {} as Record<string, string[]>);
    const printArr = [] as Array<Print>;

    const filesForBuild = findFilesForBuildRecursive(updatedOrNewFiles, importToFileMap, contractsMap, printArr);
    // recursivePrint(printArr, 3, filesForBuild);
    return filesForBuild;
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
