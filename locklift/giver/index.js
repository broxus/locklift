const Contract = require('./../contract');


/**
 * Locklift plugin for working with classic givers.
 * Supports giver from local-node and any compatible one
 */
class Giver {
  constructor(locklift) {
    this.locklift = locklift;
  }
  
  /**
   * Deploys contract by using giver.
   * 1. Derives contract address
   * 2. Sends specified amount of TONs to address
   * 3. Waits for balance to be replenished
   * 4. Deploys contract and setup address
   * @param contract Contract instance to deploy
   * @param constructorParams Constructor parameters data
   * @param initParams Initial data
   * @param keyPair Key pair to use
   * @param [amount=locklift.utils.convertCrystal(10, 'nano')] Amount in nano TONs to request from giver
   * @returns {Promise<*>}
   */
  async deployContract(
    {
      contract,
      constructorParams,
      initParams,
      keyPair
    },
    amount=this.locklift.utils.convertCrystal(10, 'nano')
  ) {
    // Extend init params with random _randomNonce if it's found in ABI and autoRandomNonce is enabled
    const extendedInitParams = initParams === undefined ? {} : initParams;
    
    if (contract.autoRandomNonce) {
      if (contract.abi.data.find(e => e.name === '_randomNonce')) {
        extendedInitParams._randomNonce = extendedInitParams._randomNonce === undefined
          ? this.locklift.utils.getRandomNonce()
          : extendedInitParams._randomNonce;
      }
    }
    
    const {
      address,
    } = await this.locklift.ton.createDeployMessage({
      contract,
      constructorParams,
      initParams: extendedInitParams,
      keyPair,
    });
    
    await this.giver.run({
      method: 'sendGrams',
      params: {
        dest: address,
        amount,
      }
    });
    
    // Wait for receiving grams
    await this.locklift.ton.client.net.wait_for_collection({
      collection: 'accounts',
      filter: {
        id: { eq: address },
        balance: { gt: `0x0` }
      },
      result: 'balance'
    });
    
    // Send deploy transaction
    const message = await this.locklift.ton.createDeployMessage({
      contract,
      constructorParams,
      initParams: extendedInitParams,
      keyPair,
    });
    
    await this.locklift.ton.waitForRunTransaction({ message, abi: contract.abi });
    
    contract.setAddress(address);
    
    return contract;
  }
  
  async setup() {
    this.giver = new Contract({
      locklift: this.locklift,
      abi: this.locklift.networkConfig.giver.abi,
      address: this.locklift.networkConfig.giver.address,
      name: 'Giver',
    });
    
    // Setup giver key in case of key-protected giver
    if (this.locklift.networkConfig.giver.key) {
      const keyPair = await this.locklift.ton.client.crypto.nacl_sign_keypair_from_secret_key({
        secret: this.locklift.networkConfig.giver.key
      });

      // TODO: looks like bug in SDK, keypair.secret is extended with keypair.public
      keyPair.secret = keyPair.secret.slice(0, 64);

      this.giver.setKeyPair(keyPair);
    }
  }
}


module.exports = Giver;
