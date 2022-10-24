import fs from "fs";
import * as fsPath from "path";

import { ExternalCotracts } from "../config";

export const typeGenerator = (pathToBuildFolder: string) => {
  const generatedCode = getAbiFiles(pathToBuildFolder)
    .map(file => getContractAbi(pathToBuildFolder, file))
    .map(({ abi, name }) => ({
      contractName: name,
      code: generateContractCode({ abiSource: abi, contractName: name }),
    }));

  const abiSources = generatedCode.reduce((acc, { code: { abi } }) => acc + abi + "\n", "");

  const typingSources = generatedCode.reduce((acc, { code: { typing } }) => acc + typing + "\n", "");

  const factorySources = generatedCode.reduce(
    (acc, { code: { contractName, abiSourceName } }) => ({
      ...acc,
      [contractName]: abiSourceName,
    }),
    {},
  );

  const factorySourceObj = `export const factorySource = ${JSON.stringify(factorySources, null, 4).replace(
    /"/g,
    "",
  )} as const\n\nexport type FactorySource = typeof factorySource`;

  fs.writeFileSync(
    fsPath.join(pathToBuildFolder, "./factorySource.ts"),
    abiSources + "\n" + factorySourceObj + "\n" + typingSources,
  );
};

const generateContractCode = ({
  abiSource,
  contractName,
}: {
  abiSource: string;
  contractName: string;
}): {
  abi: string;
  abiSourceName: string;
  typing: string;
  contractName: string;
} => {
  const abiSourceName = contractName.slice(0, 1).toLowerCase() + contractName.slice(1) + "Abi";

  return {
    abi: `const ${abiSourceName} = ${abiSource.replace(/\s/g, "")} as const`,
    abiSourceName,
    typing: `export type ${contractName}Abi = typeof ${abiSourceName}`,
    contractName,
  };
};

const getContractAbi = (pathToBuildFolder: string, fileName: string): { abi: string; name: string } => {
  const contractAbi = fs.readFileSync(fsPath.join(pathToBuildFolder, fileName), "utf8");
  const contractName = `${fileName.split(".abi.json")[0]}`;
  return {
    abi: contractAbi,
    name: contractName,
  };
};

const getAbiFiles = (buildPath: string): Array<string> => {
  return fs.readdirSync(buildPath).filter(el => el.endsWith(".abi.json"));
};

export const copyExternalFiles = (externalCotracts: ExternalCotracts, destinationFolder: string) => {
  Object.entries(externalCotracts)
    .flatMap(([folderName, contracts]) => {
      const pathToFolder = fsPath.resolve(folderName);
      const files = fs.readdirSync(pathToFolder);
      return files
        .filter(file => contracts.some(contract => contract === file.split(".")[0]))
        .map(file => ({ file, pathToFolder }));
    })
    .forEach(({ pathToFolder, file }) =>
      fs.copyFileSync(fsPath.join(pathToFolder, file), fsPath.join(destinationFolder, file)),
    );
};
