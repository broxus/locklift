import Factory from './factory';
import Giver from './giver';
import Keys from './keys';
import Ton from './ton';
import * as utils from './utils';

export class Locklift {
  config: any;
  network: string;
  networkConfig: any;
  utils = utils;
  ton!: Ton;
  keys!: Keys;
  factory!: Factory;
  giver!: Giver;

  constructor(config: any, network: string) {
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
