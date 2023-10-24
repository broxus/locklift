import dirTree from "directory-tree";
import { flatDirTree } from "../cli/builder/utils";
import path from "path";

export const getContractsTree = (pathToContractsFolder: string) => {
  const contractsNestedTree = dirTree(pathToContractsFolder, {
    extensions: /\.(sol|tsol)/,
  });

  return flatDirTree(contractsNestedTree);
};

export const getContractNameFromAbiPath = (pathToAbi: string) => {
  return path.parse(pathToAbi).name.split(".")[0];
};
