import fs from "fs-extra";

export const tryToGetFileChangeTime = (filePath: string): number | undefined => {
  try {
    return fs.statSync(filePath).mtime.getTime();
  } catch (e) {
    return undefined;
  }
};
