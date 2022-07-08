type TemplateProps = {
  contractName: string;
  contractFunctions: string;
  contractMethods: string;
  abi: string;
}

export function contractFileTemplate({
  contractName,
  contractFunctions,
  contractMethods,
  abi,
}: TemplateProps): string {
  const template =
`import { Contract } from 'locklift/contract';
import {
  BytesLike,
  ContractFunctions,
  ResultOfProcessMessage,
} from 'locklift/types';

const ${contractName}Abi = ${abi}

export class ${contractName} extends Contract {
  private _abi = ${contractName}Abi;

  private _functions: ContractFunctions = ${contractFunctions};

  private _methods = {
${contractMethods}
  }

  public get abi(): typeof ${contractName}Abi {
    return this._abi;
  }

  public get functions(): typeof ${contractName}.prototype._functions {
    return this._functions;
  }

  public get methods() {
    return this._methods;
  }
}

export default ${contractName};
`

  return template;
}
