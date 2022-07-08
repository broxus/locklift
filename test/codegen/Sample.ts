import { Contract } from 'locklift/contract';
import {
  BytesLike,
  BigNumber,
  ContractFunctions,
  ResultOfProcessMessage,
} from 'locklift/types';

const SampleAbi = {
	"ABI version": 2,
	"version": "2.2",
	"header": ["pubkey", "time", "expire"],
	"functions": [
		{
			"name": "constructor",
			"inputs": [
				{"name":"_state","type":"uint256"}
			],
			"outputs": [
			]
		},
		{
			"name": "setState",
			"inputs": [
				{"name":"_state","type":"uint256"}
			],
			"outputs": [
			]
		},
		{
			"name": "getDetails",
			"inputs": [
			],
			"outputs": [
				{"name":"_state","type":"uint256"}
			]
		}
	],
	"data": [
		{"key":1,"name":"_nonce","type":"uint16"}
	],
	"events": [
		{
			"name": "StateChange",
			"inputs": [
				{"name":"_state","type":"uint256"}
			],
			"outputs": [
			]
		}
	],
	"fields": [
		{"name":"_pubkey","type":"uint256"},
		{"name":"_timestamp","type":"uint64"},
		{"name":"_constructorFlag","type":"bool"},
		{"name":"_nonce","type":"uint16"},
		{"name":"state","type":"uint256"}
	]
}


export class Sample extends Contract {
  private _abi = SampleAbi;

  private _functions: ContractFunctions = {"constructor":{"inputs":[{"name":"_state","type":"uint256"}],"outputs":[]},"setState":{"inputs":[{"name":"_state","type":"uint256"}],"outputs":[]},"getDetails":{"inputs":[],"outputs":[{"name":"_state","type":"uint256"}]}};

  private _methods = {
    setState: {
      call(params: {_state: BytesLike}): undefined {
        return this.call<undefined, {_state: BytesLike}>({ method: 'setState', params });
      },
      run(params: {_state: BytesLike}): ResultOfProcessMessage<undefined> {
        return this.run<undefined, {_state: BytesLike}>({ method: 'setState', params });
      },
    },
    getDetails: {
      call(): {_state: BytesLike} {
        return this.call<{_state: BytesLike}, unknown>({ method: 'getDetails' });
      },
      run(): ResultOfProcessMessage<{_state: BytesLike}> {
        return this.run<{_state: BytesLike}, unknown>({ method: 'getDetails' });
      },
    },

  }

  public get abi(): typeof SampleAbi {
    return this._abi;
  }

  public get functions(): typeof Sample.prototype._functions {
    return this._functions;
  }

  public get methods() {
    return this._methods;
  }

 public async deploy({
    initParams,
    constructorParams,
  }: {
    initParams: {_nonce: BytesLike};
    constructorParams: {_state: BytesLike};
  }) {
    return await this.locklift.giver.deployContract<{_state: BytesLike}, {_nonce: BytesLike}>({
      contract: this,
      keyPair: this.keyPair,
      initParams,
      constructorParams,
    });
  }

  public async getBalance(): Promise<BigNumber> {
    if (!this.address)
      throw 'Sample is not deployed.'

    return await this.locklift.ton.getBalance(this.address);
  }
}

export default Sample;
