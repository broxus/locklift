const BigNumber = require('bignumber.js');

const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
TonClient.useBinaryLibrary(libNode);


/**
 * TON wrapper, using TonClient from TON labs SDK
 */
class Ton {
  /**
   * Initialize TON wrapper. All the configuration for TonClient should be placed in config.networks[network].ton_client
   * @param locklift
   */
  constructor(locklift) {
    this.locklift = locklift;

    this.client = new TonClient(this.locklift.config.networks[this.locklift.network].ton_client);
    this.zero_address = '0:0000000000000000000000000000000000000000000000000000000000000000';
  }
  
  async setup() {
  }
  
  /**
   * Creates deploy message for Contract instance, by using deploy_set section.
   * @param contract Contract instance
   * @param [constructorParams={}] Constructor data
   * @param [initParams={}] Initial data
   * @param keyPair Key pair to use
   * @returns {Promise<ResultOfEncodeMessage>}
   */
  async createDeployMessage({ contract, constructorParams, initParams, keyPair }) {
    const encodeParams = {
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
        input: constructorParams === undefined ? {} : constructorParams,
      },
      signer: {
        type: 'None',
      }
    };
  
    return this.locklift.ton.client.abi.encode_message(this.enrichMessageWithKeys(encodeParams, keyPair));
  }
  
  /**
   * Adds signer section to encoded message params if keyPair presented
   * @param encodeParams Encode message params
   * @param keyPair Key pair to use
   * @returns {{signer: {keys: *, type: string}}}
   */
  enrichMessageWithKeys(encodeParams, keyPair) {
    return keyPair === undefined ? encodeParams : {
      ...encodeParams,
      signer: {
        type: 'Keys',
        keys: keyPair,
      }
    };
  }
  
  /**
   * Creates run message for Contract instance by using call_set section
   * @param contract Contract instance
   * @param method Method name
   * @param params Method params
   * @param keyPair Key pair to use
   * @returns {Promise<ResultOfEncodeMessage>}
   */
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
  
  /**
   * Sends message to the network and waits till it's confirmed
   * @param message Message to send
   * @param abi Contract's ABI, used to decode transaction
   * @returns {Promise<ResultOfProcessMessage>}
   */
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
  
  /**
   * Gets balance for specific address. Raise an error if address not found
   * @param address Contract address
   * @returns {Promise<BigNumber>}
   */
  async getBalance(address) {
    const {
      result: [{
        balance
      }]
    } = await this.client.net.query_collection({
      collection: 'accounts',
      filter: {
        id: { eq: address },
      },
      result: 'balance'
    });
    
    return new BigNumber(balance);
  }
  
  /**
   * Get account type for specific address. Raise an error if address not found
   * @param address
   * @returns {Promise<{acc_type: *, acc_type_name: *}>}
   */
  async getAccountType(address) {
    const {
      result: [{
        acc_type,
        acc_type_name
      }]
    } = await this.client.net.query_collection({
      collection: 'accounts',
      filter: {
        id: { eq: address },
      },
      result: 'acc_type acc_type_name'
    });
    
    return {
      acc_type,
      acc_type_name
    }
  }
}


module.exports = Ton;
