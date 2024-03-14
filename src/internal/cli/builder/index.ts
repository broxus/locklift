import { LockliftConfig } from "../../config";
import { execSync } from "child_process";
import { copyExternalArtifacts, typeGenerator } from "../../generators";
import ejs from "ejs";
import fs from "fs";
import path, { resolve } from "path";
import _ from "underscore";
import { compileBySolC, compileBySolD, execSyncWrapper, extractContractName, resolveExternalContracts } from "./utils";
import { ParsedDoc } from "../types";

import { logger } from "../../logger";
import semver from "semver/preload";
import { getContractsTree } from "../../utils";
import { BuildCache } from "../../buildCache";
const tablemark = require("tablemark");

export type BuilderConfig = {
  includesPath?: string;
  compilerPath: string;
  linkerLibPath: string;
  linkerPath: string;
  soldPath: string;
  compilerParams?: Array<string>;
  externalContracts: LockliftConfig["compiler"]["externalContracts"];
  externalContractsArtifacts: LockliftConfig["compiler"]["externalContractsArtifacts"];
  mode: "solc" | "sold";
};
type Option = {
  build: string;
  disableIncludePath: boolean;
  contracts: string;
  force: boolean;
  externalAbiFiles?: Array<string>;
};
export class Builder {
  private options: Option;
  private nameRegex = /======= (?<contract>.*) =======/g;
  private docRegex = /(?<doc>^{(\s|.)*?^})/gm;

  constructor(private readonly config: BuilderConfig, options: Option, private readonly compilerVersion: string) {
    if (semver.gte(compilerVersion, "0.72.0") && config.linkerPath) {
      logger.printWarn("Linker is no longer used as of version 72+ and can be removed from the configuration");
    }
    if (semver.eq(compilerVersion, "0.72.0")) {
      logger.printWarn("0.72.0 compiler is considered unsafe and is not recommended. Use at your own risk!");
    }
    this.options = options;
  }

  static create(config: BuilderConfig, options: Option): Builder {
    const matchedCompilerVersion = execSync(config.compilerPath + " --version")
      .toString()
      .trim()
      .match(/(?<=Version: |sold)(.*)(?=\+commit)/);
    if (!matchedCompilerVersion) {
      throw new Error("Cannot get compiler version");
    }
    return new Builder(config, options, matchedCompilerVersion[0]);
  }

  async buildContracts(): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const contractsTree = getContractsTree(this.options.contracts)!;

    const { contractArtifacts, contractsToBuild: externalContracts } = await resolveExternalContracts(
      this.config.externalContracts,
    );
    const totalContracts = [...contractsTree.map(el => el.path), ...externalContracts];

    const buildCache = new BuildCache(totalContracts, this.options.force, this.options.build, this.config);

    const contractsToBuild = await buildCache.buildTree();

    logger.printInfo(`Found ${totalContracts.length} sources`);
    if (contractsToBuild.length > 0) {
      logger.printInfo(`Found ${contractsToBuild.length} changes, compiling...`);
      try {
        await this.compileContracts(contractsToBuild);
        logger.printInfo("Built");
        buildCache.applyCurrentCache();
      } catch (err) {
        if (err) {
          logger.printError(err);
        }
        return false;
      }
    } else {
      logger.printInfo("No changes found, skip compilation");
    }

    if (contractArtifacts.length > 0) {
      contractArtifacts.forEach(artifact =>
        fs.copyFileSync(artifact, resolve(this.options.build, path.basename(artifact))),
      );
    }

    if (this.config.externalContractsArtifacts) {
      copyExternalArtifacts(this.config.externalContractsArtifacts, this.options.build);
    }
    typeGenerator(this.options.build, ...(this.options.externalAbiFiles || []));
    logger.printInfo("factorySource generated");
    return true;
  }
  private compileContracts(contractsToBuild: Array<string>) {
    const contracts = contractsToBuild
      .map(el => ({ path: resolve(el) }))
      .map(el => ({
        ...el,
        contractFileName: extractContractName(el.path),
      }));
    if (this.config.mode === "solc") {
      logger.printInfo("Compiling with solc");
      return compileBySolC({
        contracts,
        compilerPath: this.config.compilerPath,
        compilerParams: this.config.compilerParams,
        compilerVersion: this.compilerVersion,
        linkerPath: this.config.linkerPath,
        disableIncludePath: this.options.disableIncludePath,
        linkerLibPath: this.config.linkerLibPath,
        buildFolder: this.options.build,
      });
    }
    if (this.config.mode === "sold") {
      logger.printInfo("Compiling with sold");
      return compileBySolD({
        contracts,
        compilerPath: this.config.compilerPath,
        compilerParams: this.config.compilerParams,
        compilerVersion: this.compilerVersion,
        disableIncludePath: this.options.disableIncludePath,
        buildFolder: this.options.build,
        soldPath: this.config.soldPath,
      });
    }
  }

  buildDocs(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const contractsTree = getContractsTree(this.options.contracts)!;

    try {
      logger.printInfo(`Found ${contractsTree.length} sources`);

      let docs: ParsedDoc[] = [];
      contractsTree.map(({ path }) => {
        logger.printInfo(`Building ${path}`);

        const output = execSyncWrapper(
          //@ts-ignore
          `cd ${this.options.build} && ${this.config.compilerPath} ./../${path} --${this.options.mode}`,
        );

        logger.printInfo(`Compiled ${path}`);

        docs = [...docs, ...this.parseDocs(output.toString())];
      });

      // Filter duplicates by (path, name)
      docs = docs.reduce((acc: ParsedDoc[], doc: ParsedDoc) => {
        if (acc.find(({ path, name }) => path === doc.path && name === doc.name)) {
          return acc;
        }

        return [...acc, doc];
      }, []);

      // Sort docs by name (A-Z)
      docs = docs.sort((a, b) => (a.name < b.name ? -1 : 1));

      // Save docs in markdown format
      const render = ejs.render(
        fs.readFileSync(resolve(__dirname, "./../templates/index.ejs")).toString(),
        {
          docs,
          tablemark,
        },
        {
          rmWhitespace: true,
        },
      );
      //@ts-ignore
      fs.writeFileSync(
        //@ts-ignore
        resolve(process.cwd(), this.options.docs, "index.md"),
        render,
      );

      logger.printInfo("Docs generated successfully!");
    } catch (e) {
      logger.printError(e);
      return false;
    }

    return true;
  }

  private parseDocs(output: string): ParsedDoc[] {
    const contracts = [...output.matchAll(this.nameRegex)]
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .map(m => m.groups!.contract)
      // For the target contracts compiler returns relative path
      // and for dependency contracts paths are absolute
      // Make them all absolute
      .map(c => resolve(process.cwd(), this.options.build, c));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const docs = [...output.matchAll(this.docRegex)].map(m =>
      //@ts-ignore
      JSON.parse(m.groups?.doc),
    );

    return _.zip(contracts, docs).reduce((acc: ParsedDoc[], [contract, doc]: string[]) => {
      const [path, name] = contract.split(":");

      // Check name matches the "include" pattern and contract is located in the "contracts" dir
      if (
        //@ts-ignore
        name.match(new RegExp(this.options.include)) !== null &&
        path.startsWith(`${process.cwd()}/${this.options.contracts}`)
      ) {
        return [
          ...acc,
          {
            path: path.replace(`${process.cwd()}/`, ""),
            name,
            doc,
          },
        ];
      }

      return acc;
    }, []);
  }
}
