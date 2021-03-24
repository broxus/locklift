const BigNumber = require('bignumber.js');

const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
TonClient.useBinaryLibrary(libNode);


class Ton {
  constructor(locklift) {
    this.locklift = locklift;

    this.client = new TonClient(this.locklift.config.networks[this.locklift.network].ton_client);
  }
  
  async setup() {
  }
  
  async createDeployMessage({ contract, constructorParams, initParams, keyPair }) {
    let encodeParams = {
      abi: {
        type: "Contract",
        value: contract.abi,
      },
      deploy_set: {
        tvc: contract.base64,
        initial_data: initParams,
      },
      call_set: {
        function_name: 'constructor',
        input: constructorParams,
      },
      signer: {
        type: 'None',
      }
    };
  
    return this.locklift.ton.client.abi.encode_message(this.enrichMessageWithKeys(encodeParams, keyPair));
  }
  
  enrichMessageWithKeys(encodeParams, keyPair) {
    return keyPair === undefined ? encodeParams : {
      ...encodeParams,
      signer: {
        type: 'Keys',
        keys: keyPair,
      }
    };
  }
  
  async createRunMessage({ contract, method, params, keyPair }) {
    const encodeParams = {
      address: contract.address,
      abi: {
        type: "Contract",
        value: contract.abi,
      },
      call_set: {
        function_name: method,
        input: params,
      },
      signer: {
        type: 'None',
      }
    };
  
    return this.locklift.ton.client.abi.encode_message(this.enrichMessageWithKeys(encodeParams, keyPair));
  }
  
  async waitForRunTransaction({ message, abi }) {
    const {
      shard_block_id,
    } = await this
      .locklift
      .ton
      .client
      .processing
      .send_message({
        message: message.message,
        send_events: false,
      });
  
    return this
      .locklift
      .ton
      .client
      .processing
      .wait_for_transaction({
        message: message.message,
        shard_block_id,
        send_events: false,
        abi: {
          type: 'Contract',
          value: abi
        },
      });
  }
  
  async getBalance(address) {
    const {
      result: [{
        balance
      }]
    } = await this.locklift.click.net.query_collection({
      collection: 'accounts',
      filter: {
        id: { eq: address },
      },
      result: 'balance'
    });
    
    return new BigNumber(balance);
  }
}


module.exports = Ton;
