const OutputDecoder = require('./output-decoder');


/**
 * Smart contract object.
 */
class Contract {
  /**
   * Contract constructor
   * @param locklift Locklift instance
   * @param abi Contract ABI
   * @param base64 Contract base64 encoded TVC
   * @param code Contract code
   * @param name Contract name
   * @param address Contract address
   * @param keyPair Default keyPair to use for interacting with smart contract
   */
  constructor({ locklift, abi, base64, code, name, address, keyPair }) {
    this.locklift = locklift;
    this.abi = abi;
    this.base64 = base64;
    this.code = code;
    this.name = name;
    this.address = address;
    this.keyPair = keyPair;
  }
  
  /**
   * Set contract address
   * @param address
   */
  setAddress(address) {
    this.address = address;
  }
  
  /**
   * Set key pair to use for interacting with contract.
   * @param keyPair
   */
  setKeyPair(keyPair) {
    this.keyPair = keyPair;
  }
  
  /**
   * Run smart contract method. Create run message and wait for transaction.
   * @param method Method name
   * @param params Method params
   * @param [keyPair=this.keyPair] Key pair to use
   * @returns {Promise<*>}
   */
  async run({ method, params, keyPair }) {
    const message = await this.locklift.ton.createRunMessage({
      contract: this,
      method,
      params: params === undefined ? {} : params,
      keyPair: keyPair === undefined ? this.keyPair : keyPair,
    });
  
    return this.locklift.ton.waitForRunTransaction({ message, abi: this.abi });
  }
  
  /**
   * Call smart contract method. Uses runLocal to run TVM code locally and decodes result
   * according to the ABI.
   * @param method Method name
   * @param params Method params
   * @param [keyPair=this.keyPair] Keypair to use
   * @returns {Promise<void>} Decoded output
   */
  async call({ method, params, keyPair }) {
    const {
      message
    } = await this.locklift.ton.createRunMessage({
      contract: this,
      method,
      params: params === undefined ? {} : params,
      keyPair: keyPair === undefined ? this.keyPair : keyPair,
    });
  
    const {
      result: [{
        boc
      }]
    } = await this.locklift.ton.client.net.query_collection({
      collection: 'accounts',
      filter: {
        id: {
          eq: this.address,
        }
      },
      result: 'boc'
    });
  
    // Get output of the method run execution
    const {
      decoded: {
        output,
      }
    } = await this.locklift.ton.client.tvm.run_tvm({
      abi: {
        type: 'Contract',
        value: this.abi
      },
      message: message,
      account: boc,
    });
  
    // Decode output
    const functionAttributes = this.abi.functions.find(({ name }) => name === method);
  
    const outputDecoder = new OutputDecoder(
      output,
      functionAttributes
    );
  
    return outputDecoder.decode();
  }
}


module.exports = Contract;
