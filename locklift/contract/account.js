const Contract = require('./index');


/**
 * Account contract wrapping. Extending Contract object. Implements method
 * for internal calling other contracts by calling sendTransaction method.
 */
class Account extends Contract {
  /**
   * Run another contracts method as internal message
   * If method and params not specified - sends value without payload.
   * You may use Account contract of create your own contract with same sendTransaction signature
   * @param contract Contract instance
   * @param method Contract's method name
   * @param params Contract's method params
   * @param [value=this.locklift.utils.convertCrystal('2', 'nano')] Value to attach in nano TONs
   * @param [keyPair=this.keyPair] Key pair to use
   * @returns {Promise<*>}
   */
  async runTarget({ contract, method, params, value, keyPair }) {
    let body = '';
    
    if (method !== undefined) {
      const extendedParams = params === undefined ? {} : params;
  
      if (this.autoAnswerIdOnCall) {
        if (contract.abi.functions.find(e => e.name === method).inputs.find(e => e.name === '_answer_id')) {
          extendedParams._answer_id = extendedParams._answer_id === undefined ? 1 : extendedParams._answer_id;
        } else if (contract.abi.functions.find(e => e.name === method).inputs.find(e => e.name === 'answerId')) {
          extendedParams.answerId = extendedParams.answerId === undefined ? 1 : extendedParams.answerId;
        }
      }
  
      const message = await this.locklift.ton.client.abi.encode_message_body({
        address: contract.address,
        abi: {
          type: "Contract",
          value: contract.abi,
        },
        call_set: {
          function_name: method,
          input: extendedParams,
        },
        signer: {
          type: 'None',
        },
        is_internal: true,
      });
      
      body = message.body;
    }
    
    return this.run({
      method: 'sendTransaction',
      params: {
        dest: contract.address,
        value: value === undefined ?
          this.locklift.utils.convertCrystal('2', 'nano') : value,
        bounce: true,
        flags: 0,
        payload: body,
      },
      keyPair: keyPair === undefined ? this.keyPair : keyPair,
    });
  }
}


module.exports = Account;
