import fs from 'fs';


export function checkDirEmpty(dir: fs.PathLike): fs.PathLike | boolean {
  if (!fs.existsSync(dir)) {
    return dir;
  }

  return fs.readdirSync(dir).length === 0;
}


export function initializeDirIfNotExist(dir: fs.PathLike): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}


export { flatDirTree } from './flatDirTree';


export { Builder, ParsedDoc } from './Builder';


export { Codegen } from './Codegen';
