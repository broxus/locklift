/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import fs from "fs";
import { DirectoryTree } from "directory-tree";
import { LockliftConfig } from "../../config";
import { BuilderConfig } from "./index";
import * as Buffer from "buffer";
import { ExecSyncOptionsWithBufferEncoding, ExecSyncOptionsWithStringEncoding } from "child_process";
export declare function checkDirEmpty(dir: fs.PathLike): fs.PathLike | boolean;
export declare function flatDirTree(tree: DirectoryTree): DirectoryTree[] | undefined;
export declare const compilerConfigResolver: ({ compiler, linker, }: Pick<LockliftConfig, "compiler" | "linker">) => Promise<BuilderConfig>;
export declare const tvcToBase64: (tvc: Buffer) => string;
export declare const extractContractName: (pathToFile: string) => string;
export declare function execSyncWrapper(command: string): Buffer;
export declare function execSyncWrapper(command: string, options: ExecSyncOptionsWithStringEncoding): string;
export declare function execSyncWrapper(command: string, options: ExecSyncOptionsWithBufferEncoding): Buffer;
export declare const tryToGetNodeModules: () => string | undefined;
