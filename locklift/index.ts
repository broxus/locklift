import Factory from './factory';
import Giver from './giver';
import Keys from './keys';
import Ton from './ton';
import * as utils from './utils';
import { LockliftConfig } from './config';
import { ValueOf } from './types';

export class Locklift {
  config: LockliftConfig;
  networkConfig: ValueOf<LockliftConfig['networks']>;
  network: keyof LockliftConfig['networks'];
  ton!: Ton;
  keys!: Keys;
  factory!: Factory;
  giver!: Giver;
  utils = utils;

  constructor(config: LockliftConfig, network = 'local') {
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
