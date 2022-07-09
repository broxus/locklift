const Factory = require("./factory");
const Giver = require("./giver");
const Keys = require("./keys");
const Everscale = require("./ever");
const Utils = require("./utils");

class Locklift {
  constructor(config, network) {
    this.config = config;
    this.network = network;

    this.networkConfig = this.config.networks[this.network];
  }

  async setup() {
    this.ever = new Everscale(this);
    this.factory = new Factory(this);
    this.giver = new Giver(this);
    this.keys = new Keys(this);
    this.utils = new Utils(this);

    await this.ever.setup();
    await this.factory.setup();
    await this.giver.setup();
    await this.keys.setup();
  }
}

module.exports = {
  Locklift,
};
