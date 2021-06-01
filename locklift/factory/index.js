const path = require('path');

const utils = require('./../utils');
const Contract = require('./../contract');
const Account = require('./../contract/account');


/**
 * Factory object for generating initializing Contract objects.
 */
class Factory {
  constructor(locklift) {
    this.locklift = locklift;
  }
  
  /**
   * Initialize Contract object by it's name and build path.
   * Loads Base64 TVC encoded, ABI, derive code from base64 TVC.
   * @param name
   * @param resolvedPath
   * @returns {Promise<Contract>}
   */
  async initializeContract(name, resolvedPath) {
    const base64 = utils.loadBase64FromFile(`${resolvedPath}/${name}.base64`);
    const abi = utils.loadJSONFromFile(`${resolvedPath}/${name}.abi.json`);
  
    const {
      code
    } = await this.locklift.ton
      .client
      .boc
      .get_code_from_tvc({
        tvc: base64,
      });
  
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
  async getContract(name, build='build') {
    const resolvedBuildPath = path.resolve(process.cwd(), build);
    
    return this.initializeContract(name, resolvedBuildPath);
  }
  
  async getAccount(name='Account', build='build') {
    const resolvedBuildPath = path.resolve(process.cwd(), build);

    const contract = await this.initializeContract(name, resolvedBuildPath);
    
    return new Account({
      locklift: this.locklift,
      abi: contract.abi,
      base64: contract.base64,
      code: contract.code,
      name: contract.name
    });
  }
  
  async setup() {
  
  }
}


module.exports = Factory;
