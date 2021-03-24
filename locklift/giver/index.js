const Contract = require('./../contract');
const utils = require('./../utils');


class Giver {
  constructor(locklift) {
    this.locklift = locklift;
  }

  async deployContract(
    {
      contract,
      constructorParams,
      initParams,
      keyPair
    },
    amount=utils.convertCrystal(1, 'nano')
  ) {
    const {
      address,
    } = await this.locklift.ton.createDeployMessage({
      contract,
      constructorParams,
      initParams,
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
      initParams,
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
    });
  }
}


module.exports = Giver;
