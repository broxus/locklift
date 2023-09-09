import dirTree from "directory-tree";
import { flatDirTree } from "../cli/builder/utils";

export const getContractsTree = (pathToContractsFolder: string) => {
  const contractsNestedTree = dirTree(pathToContractsFolder, {
    extensions: /\.(sol|tsol)/,
  });

  return flatDirTree(contractsNestedTree);
};
