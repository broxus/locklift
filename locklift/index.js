const Factory = require('./factory');
const Giver = require('./giver');
const Keys = require('./keys');
const Ton = require('./ton');


class Locklift {
  constructor(config, network) {
    this.config = config;
    this.network = network;
    
    this.networkConfig = this.config.networks[this.network];
  }
  
  async setup() {
    this.ton = new Ton(this);
    this.factory = new Factory(this);
    this.giver = new Giver(this);
    this.keys = new Keys(this);
  
    await this.ton.setup();
    await this.factory.setup();
    await this.giver.setup();
    await this.keys.setup();
  }
}


module.exports = {
  Locklift,
};
