const path = require('path');
const utils = require('./../utils');
const Contract = require('./../contract');


class Factory {
  constructor(locklift) {
    this.locklift = locklift;
  }
  
  async getContract(name) {
    const resolvedBuildPath = path.resolve(process.cwd(), 'build');

    const base64 = utils.loadBase64FromFile(`${resolvedBuildPath}/${name}.base64`);
    const abi = utils.loadJSONFromFile(`${resolvedBuildPath}/${name}.abi.json`);
  
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
  
  async setup() {
  
  }
}


module.exports = Factory;
