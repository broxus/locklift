const OutputDecoder = require('./output-decoder');


class Contract {
  constructor({ locklift, abi, base64, code, name, address }) {
    this.locklift = locklift;
    this.abi = abi;
    this.base64 = base64;
    this.code = code;
    this.name = name;
    this.address = address;
  }
  
  setAddress(address) {
    this.address = address;
  }
  
  async run({ method, params, keyPair }) {
    const message = await this.locklift.ton.createRunMessage({
      contract: this,
      method,
      params,
      keyPair
    });
  
    return this.locklift.ton.waitForRunTransaction({ message, abi: this.abi });
  }
  
  async call({ method, params, keyPair }) {
    const {
      message
    } = await this.locklift.ton.createRunMessage({
      contract: this,
      method,
      params,
      keyPair
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
  
    const functionAttributes = this.abi.functions.find(({ name }) => name === method);
  
    const outputDecoder = new OutputDecoder(
      output,
      functionAttributes
    );
  
    return outputDecoder.decode();
  }
}


module.exports = Contract;
