import { ComponentType } from "./constants";
import { httpService } from "../httpService";
import semver from "semver/preload";
import * as process from "process";

const platforms = {
  isWin32: process.platform === "win32",
  isLinux: process.platform === "linux",
  isDarwin: process.platform === "darwin",
};
export const platformToSoldTychoPlatform: Record<"win32" | "linux" | "darwin", string> = {
  win32: "Windows",
  linux: "Linux",
  darwin: "macOS",
};

export const getGzFileName = (fileName: string) => `${fileName}.gz`;

const getLinkerUrl = ({ version }: { version: string }) =>
  `https://binaries.tonlabs.io/${getGzFileName(getLinkerFileName({ version }))}`;
const getCompilerUrl = ({ version }: { version: string }) =>
  `https://binaries.tonlabs.io/${getGzFileName(getCompilerFileName({ version }))}`;

const getSoldUrl = ({ version }: { version: string }) =>
  `https://github.com/everx-labs/TVM-Solidity-Compiler/releases/download/${version}/sold_${replaceDots(version)}_${
    process.platform
  }.gz`;

const getTychoSoldUrl = ({ version }: { version: string }) => {
  return `https://github.com/broxus/TVM-Solidity-Compiler/releases/download/v${version}/sold-v${version}-${
    platformToSoldTychoPlatform[process.platform as "win32" | "linux" | "darwin"]
  }.gz`;
};
const getLibUrl = ({ version }: { version: string }) =>
  `http://sdkbinaries.tonlabs.io/${getGzFileName(getLibFileName({ version }))}`;

export const replaceDots = (arg: string): string => arg.replace(/\./g, "_");

const getLinkerFileName = ({ version }: { version: string }) =>
  `tvm_linker_${replaceDots(version)}_${process.platform}`;

const getCompilerFileName = ({ version }: { version: string }) => `solc_${replaceDots(version)}_${process.platform}`;

const getLibFileName = ({ version }: { version: string }) => `stdlib_sol_${replaceDots(version)}.tvm`;

const getSoldFileName = ({ version }: { version: string }) => {
  return `sold_${replaceDots(version)}_${process.platform}`;
};
const getTychoSoldFileName = ({ version }: { version: string }) => {
  return `sold-v${version}-${platformToSoldTychoPlatform[process.platform as "win32" | "linux" | "darwin"]}`;
};

export const downloadLinks: Record<ComponentType, (arg: { version: string }) => string> = {
  [ComponentType.COMPILER]: getCompilerUrl,
  [ComponentType.LINKER]: getLinkerUrl,
  [ComponentType.LIB]: getLibUrl,
  [ComponentType.SOLD_COMPILER]: getSoldUrl,
  [ComponentType.SOLD_COMPILER_TYCHO]: getTychoSoldUrl,
};
export const fileNames: Record<ComponentType, (arg: { version: string }) => string> = {
  [ComponentType.COMPILER]: getCompilerFileName,
  [ComponentType.LINKER]: getLinkerFileName,
  [ComponentType.LIB]: getLibFileName,
  [ComponentType.SOLD_COMPILER]: getSoldFileName,
  [ComponentType.SOLD_COMPILER_TYCHO]: getTychoSoldFileName,
};

const getExecutableCompilerName = ({ version }: { version: string }): string => {
  const fileName = fileNames[ComponentType.COMPILER]({ version });
  if (platforms.isWin32) {
    return fileName + ".exe";
  }
  return fileName;
};
const getExecutableLinkerName = ({ version }: { version: string }): string => {
  const fileName = fileNames[ComponentType.LINKER]({ version });
  if (platforms.isWin32) {
    return fileName + ".exe";
  }
  return fileName;
};
const getExecutableLibName = ({ version }: { version: string }): string => {
  return fileNames[ComponentType.LIB]({ version });
};

const getExecutableSoldName = ({ version }: { version: string }): string => {
  const fileName = fileNames[ComponentType.SOLD_COMPILER]({ version });
  if (platforms.isWin32) {
    return fileName + ".exe";
  }
  return fileName;
};
const getExecutableTychoSoldName = ({ version }: { version: string }): string => {
  const fileName = fileNames[ComponentType.SOLD_COMPILER_TYCHO]({ version });
  if (platforms.isWin32) {
    return fileName + ".exe";
  }
  return fileName;
};
export const executableFileName: Record<ComponentType, (arg: { version: string }) => string> = {
  [ComponentType.COMPILER]: getExecutableCompilerName,
  [ComponentType.LINKER]: getExecutableLinkerName,
  [ComponentType.LIB]: getExecutableLibName,
  [ComponentType.SOLD_COMPILER]: getExecutableSoldName,
  [ComponentType.SOLD_COMPILER_TYCHO]: getExecutableTychoSoldName,
};

export const getSupportedVersions = ({ component }: { component: ComponentType }): Promise<Array<string>> => {
  switch (component) {
    case ComponentType.COMPILER:
      return httpService
        .get<{ solc: Array<string> }>("https://binaries.tonlabs.io/solc.json")
        .then(res => res.data.solc);
    case ComponentType.LINKER:
      return httpService
        .get<{ tvm_linker: Array<string> }>("https://binaries.tonlabs.io/tvm_linker.json")
        .then(res => res.data.tvm_linker);
    case ComponentType.LIB:
      return httpService
        .get<{ solc: Array<string> }>("https://binaries.tonlabs.io/solc.json")
        .then(res => res.data.solc);
    case ComponentType.SOLD_COMPILER:
      return httpService
        .get<{ tag_name: string }[]>("https://api.github.com/repos/tonlabs/TVM-Solidity-Compiler/releases")
        .then(res =>
          res.data
            .filter(el => {
              try {
                return semver.gte(el.tag_name, "0.72.0");
              } catch (e) {
                return false;
              }
            })
            .map(el => el.tag_name),
        );
    case ComponentType.SOLD_COMPILER_TYCHO:
      return httpService
        .get<{ tag_name: string }[]>("https://api.github.com/repos/broxus/TVM-Solidity-Compiler/releases")
        .then(res => res.data.map(el => el.tag_name));
  }
};
