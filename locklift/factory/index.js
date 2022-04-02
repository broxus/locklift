const dirTree = require("directory-tree");

const utils = require('./../utils');
const  { flatDirTree } = require('../cli/utils');
const Contract = require('./../contract');
const Account = require('./../contract/account');
const fs = require('fs');


/**
 * Factory object for generating initializing Contract objects.
 */
class Factory {
  constructor(locklift) {
    this.locklift = locklift;
    this.build = this.locklift.build
    this.external_build = this.locklift.external_build
    this.artifacts = {}
  }
  
  /**
   * Initialize Contract object by it's name and build path.
   * Loads Base64 TVC encoded, ABI, derive code from base64 TVC.
   * @param name
   * @param resolvedPath
   * @returns {Promise<Contract>}
   */
  async initializeContract(name, resolvedPath) {
    let abi, code, base64;
    const cached = this.artifacts[`${resolvedPath}/${name}`];
    if (cached) {
      ({ abi, code, base64 } = cached);
    } else {
      base64 = utils.loadBase64FromFile(`${resolvedPath}/${name}.base64`);
      abi = utils.loadJSONFromFile(`${resolvedPath}/${name}.abi.json`);
      ({ code } = await this.locklift.ton
          .client
          .boc
          .get_code_from_tvc({
            tvc: base64,
          }));
    }
  
    return new Contract({
      locklift: this.locklift,
      abi,
      base64,
      code,
      name,
    });
  }
  
  /**
   * Get contract instance
   * @param name Contract file name
   * @param [build='build'] Build path
   * @returns {Promise<Contract>}
   */
  async getContract(name, build=this.build) {
    return this.initializeContract(name, build);
  }
  
  async getAccount(name='Account', build=this.build) {
    const contract = await this.initializeContract(name, build);
    
    return new Account({
      locklift: this.locklift,
      abi: contract.abi,
      base64: contract.base64,
      code: contract.code,
      name: contract.name
    });
  }

  async cacheBuildDir(directory) {
    const filesTree = dirTree(directory, { extensions: /\.tvc/ });
    const files_flat = flatDirTree(filesTree);
    await Promise.all(files_flat.map(async (file) => {
      const tvc = fs.readFileSync(file.path, 'base64');
      const decoded = await this.locklift.ton.client.boc.decode_tvc({tvc: tvc});
      const contract_name = file.name.slice(0, -4);
      const abi = utils.loadJSONFromFile(`${directory}/${contract_name}.abi.json`);
      this.artifacts[`${directory}/${contract_name}`] = {...decoded, name: contract_name, abi: abi, base64: tvc, build: this.build};
    }));
  }
  
  async setup() {
    await this.cacheBuildDir(this.build)
    await Promise.all(this.external_build.map(async (dir) => {
      await this.cacheBuildDir(dir);
    }));
  }
}


module.exports = Factory;
