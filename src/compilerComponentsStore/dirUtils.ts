import envPaths from "env-paths";
import fs from "fs-extra";
import path from "path";

import { ComponentType, PACKAGE_NAME } from "./constants";
import { replaceDots } from "./utils";

const getCacheDir = (): string => {
  const dataDir = envPaths(PACKAGE_NAME).cache;
  fs.ensureDirSync(dataDir);
  return dataDir;
};
const getComponentsDir = ({ component }: { component: ComponentType }): string => {
  const dir = path.resolve(getCacheDir(), component);
  fs.ensureDirSync(dir);
  return dir;
};

export const getPathToVersion = ({ component, version }: { component: ComponentType; version: string }): string => {
  return path.join(getComponentsDir({ component }), replaceDots(version));
};

export const isComponentVersionExists = ({
  version,
  component,
}: {
  version: string;
  component: ComponentType;
}): boolean => {
  return fs.existsSync(getPathToVersion({ component, version: replaceDots(version) }));
};
