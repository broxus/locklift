import fs from 'fs';
import { resolve } from 'path';
import dirTree, { DirectoryTree } from 'directory-tree';
import { AbiContract } from '@tonclient/core';
import ContractFile from './ContractFile';
import { flatDirTree } from '../flatDirTree';

const SUPPORTED_ABI_VERSIONS = ['2.2'];

export type AbiData = {
	name: string;
	abi: AbiContract;
  original: string;
}

export const DEFAULT_OUTPUT_FOLDER_NAME = 'codegen';

export class Codegen {
  static DEFAULT_OUTPUT_FOLDER = `./${DEFAULT_OUTPUT_FOLDER_NAME}`;
  private options: any;
  private config: any;
  private abiFolder: string;
  private outputFolder = Codegen.DEFAULT_OUTPUT_FOLDER;

  constructor(config: any, options: any) {
    this.config = config;
    this.options = options;
    this.abiFolder = options.build || options.path;
    this.outputFolder = options.output;
  }

  build(): boolean {
    const abisTree = this.getAbisTree()!;

    try {
      this.log(`Found ${abisTree.length} sources`);

      const abisData = this.getAbisDataFromTree(abisTree);

      if (!abisData.length) {
        this.log('No abis found');

        return false;
      }

      this.log(`Generate contracts from ${abisData.length} sources`);

      for (const abiData of abisData) {
        try {
          if (!fs.existsSync(this.outputFolder))
            fs.mkdirSync(this.outputFolder);

          const file = new ContractFile(abiData);

          file.write();
        } catch(e) {
          console.error(e);
          this.log(`Unable to generate contract from source ${abiData.name}`);
        }
      }

      return true;
    } catch(err) {
      return false;
    }
  }

  private getAbisDataFromTree(abisTree: DirectoryTree[]): AbiData[] {
    return abisTree.reduce((acc: AbiData[], abi: DirectoryTree) => {
      const abiString = fs.readFileSync(resolve(process.cwd(), abi.path)).toString();

      try {
        const abiJson: AbiContract = JSON.parse(abiString);

        if (SUPPORTED_ABI_VERSIONS.includes(abiJson.version!)) {
          acc.push({
            name: abi.name,
            abi: abiJson,
            original: abiString,
          });
        } else {
          this.log(`Abi version ${abiJson.version} is not supported.`);
        }
      } catch(e) {
        this.log(`Abi is not recognised in ${abi.name}`);
      } finally {
        return acc;
      }
    }, []);
  }

  private getAbisTree(): DirectoryTree[] | undefined {
    const contractsNestedTree = dirTree(
      this.abiFolder,
      { extensions: /\.(abi|json)$/ }
    );

    return flatDirTree(contractsNestedTree);
  }

  private log(text: string): void {
    console.log(text);
  }
}
