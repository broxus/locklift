import fs from "fs-extra";

export const tryToGetFileChangeTime = (filePath: string): Promise<number | undefined> => {
  return fs
    .stat(filePath)
    .then(file => file.mtime.getTime())
    .catch(() => undefined);
};
