type TemplateProps = {
  contractName: string;
  contractFunctions: string;
  contractMethods: string;
  contractDeployMethod: string;
  abi: string;
}

export function contractFileTemplate({
  contractName,
  contractFunctions,
  contractMethods,
  contractDeployMethod,
  abi,
}: TemplateProps): string {
  const template =
`import { Contract } from 'locklift/contract';
import {
  Bytes,
  BytesLike,
  BigNumber,
  KeyPair,
  ResultOfProcessMessage,
  CodegenContractConstructorParams,
} from 'locklift/types';

const ${contractName}Abi = ${abi}

export class ${contractName} extends Contract {
  public abi = ${contractName}Abi;

  constructor(params: CodegenContractConstructorParams) {
    const extendedParams = {
      ...params,
      name: '${contractName}',
      abi: ${contractName}Abi,
    }

    super(extendedParams);
  }

  private _functions = ${contractFunctions};

  private _methods = {
${contractMethods}
  }

  public get functions(): typeof ${contractName}.prototype._functions {
    return this._functions;
  }

  public get methods() {
    return this._methods;
  }

${contractDeployMethod}

  public async getBalance(): Promise<BigNumber> {
    if (!this.address)
      throw '${contractName} is not deployed.'

    return await this.locklift.ton.getBalance(this.address);
  }
}

export default ${contractName};
`

  return template;
}
