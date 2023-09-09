import { DirectoryTree } from "directory-tree";
import fs from "fs-extra";
import path from "path";
import { tryToGetNodeModules } from "../cli/builder/utils";
import { tryToGetFileChangeTime } from "./utils";
import { logger } from "../logger";
import chalk from "chalk";
const importMatcher = /^\s*import\s*(?:{[^}]+}\s*from\s*)?["']([^"']+\.tsol)["'];/gm;
const contractMatcher = new RegExp(/^contract [A-Za-z0-9_]+\s+is [A-Za-z0-9_]+\s+\{/gm);
export class BuildCash {
  private readonly buildCashFolder = path.join("buildCash", "buildCash.json");
  private readonly prevCash: Record<string, { modificationTime: number }>;

  constructor(private readonly contracts: DirectoryTree<Record<string, any>>[]) {
    fs.ensureFileSync(this.buildCashFolder);
    this.prevCash = fs.readJSONSync(this.buildCashFolder, { throws: false }) || [];
  }

  buildTree() {
    const pathToNodeModules = tryToGetNodeModules();
    const contractsMap = new Map<string, boolean>();
    const contractsWithImports = this.contracts.map(el => {
      const contractFile = fs.readFileSync(el.path, {
        encoding: "utf-8",
      });

      if (new RegExp(/^contract [A-Za-z0-9_]+\s+is\s+[A-Za-z0-9_,\s]+\{/gm).test(contractFile)) {
        contractsMap.set(el.path, true);
      }
      const imports = Array.from(contractFile.matchAll(importMatcher))
        .map(el => el[1])
        .map(imp => {
          const localImportPath = path.join(el.path, "..", imp);
          const localFileChangeTime = tryToGetFileChangeTime(localImportPath);
          if (localFileChangeTime) {
            return {
              path: localImportPath,
              modificationTime: localFileChangeTime,
            };
          }
          const nodeModulesImportPath = path.join(pathToNodeModules!, imp);
          const nodeModulesFileChangeTime = tryToGetFileChangeTime(nodeModulesImportPath);
          if (nodeModulesFileChangeTime) {
            return {
              path: nodeModulesImportPath,
              modificationTime: nodeModulesFileChangeTime,
            };
          }
          throw new Error(`Can't find import ${imp}`);
        });

      return { name: el.name, path: el.path, imports };
    });
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

    // if (!this.prevCash) {
    //   return;
    // }

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

    recursivePrint(printArr, 3, filesForBuild);
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
    if (visitedMap.get(filePath)) {
      return acc;
    }
    /// debug
    const newPrintArr = [] as Array<Print>;
    printArr.push({ filePath, subDep: newPrintArr });
    ///
    if (!importRecords) {
      acc.push(filePath);

      return acc;
    }
    // const notVisitedFiles = importRecords.filter(el => !visitedMap.get(el));
    const notVisitedFiles = importRecords;

    if (notVisitedFiles.length === 0) {
      acc.push(filePath);
      return acc;
    }
    if (contractsMap.get(filePath)) {
      acc.push(filePath);
    }

    visitedMap.set(filePath, true);
    console.log(`file ${filePath} was visited, imports: ${notVisitedFiles.join("\n")})}`);

    // acc.push(filePath);
    return [
      ...acc,
      ...findFilesForBuildRecursive(notVisitedFiles, importToFileMap, contractsMap, newPrintArr, visitedMap),
    ];
  }, [] as string[]);
};
