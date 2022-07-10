import { Contract } from 'locklift/contract';
import {
  BytesLike,
  BigNumber,
  KeyPair,
  ResultOfProcessMessage,
  CodegenContractConstructorParams,
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
  public abi = SampleAbi;

  constructor(params: CodegenContractConstructorParams) {
    const extendedParams = {
      ...params,
      name: 'Sample',
      abi: SampleAbi,
    }

    super(extendedParams);
  }

  private _functions = {"constructor":{"inputs":[{"name":"_state","type":"uint256"}],"outputs":[]},"setState":{"inputs":[{"name":"_state","type":"uint256"}],"outputs":[]},"getDetails":{"inputs":[],"outputs":[{"name":"_state","type":"uint256"}]}};

  private _methods = {
    setState: {
      call(params: {_state: number}, keyPair?: KeyPair): Promise<undefined> {
        return Sample.prototype.call<undefined, {_state: number}>({
          method: 'setState', keyPair: keyPair || Sample.prototype.keyPair!, params
        });
      },
      run(params: {_state: number}, keyPair?: KeyPair): Promise<ResultOfProcessMessage<undefined>> {
        return Sample.prototype.run<undefined, {_state: number}>({
          method: 'setState', keyPair: keyPair || Sample.prototype.keyPair!, params
        });
      },
    },
    getDetails: {
      call(keyPair?: KeyPair): Promise<{_state: number}> {
        return Sample.prototype.call<{_state: number}, unknown>({
          method: 'getDetails', keyPair: keyPair || Sample.prototype.keyPair!
        });
      },
      run(keyPair?: KeyPair): Promise<ResultOfProcessMessage<{_state: number}>> {
        return Sample.prototype.run<{_state: number}, unknown>({
          method: 'getDetails', keyPair: keyPair || Sample.prototype.keyPair!
        });
      },
    },

  }

  public get functions(): typeof Sample.prototype._functions {
    return this._functions;
  }

  public get methods() {
    return this._methods;
  }

  public async deploy({
    keyPair,
    initParams,
    constructorParams,
  }: {
    keyPair?: KeyPair;
    initParams: {_nonce: number};
    constructorParams: {_state: number};
  }) {
    return await this.locklift.giver.deployContract<{_state: number}, {_nonce: number}>({
      contract: this,
      keyPair: keyPair || this.keyPair!,
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
