import fs from 'fs';
import { resolve } from 'path';
import { AbiFunction, AbiParam } from '@tonclient/core';
import { ContractFunctions } from '../../../types';
import {
  contractFileTemplate,
  contractMethodTemplate,
  contractDeployMethodTemplate,
} from './templates';
import { Types } from '../../../contract/output-decoder';
import { AbiData, DEFAULT_OUTPUT_FOLDER_NAME } from './';

class ContractFile {
  private contractName: string;
  private contractFile: string;

  constructor(abiData: AbiData) {
    console.log(abiData);

    this.contractName = abiData.name.split('.')[0];

    const contractFunctions = JSON.stringify(this.getFunctionsObject(abiData)) || '';

    const contractMethods = abiData.abi.functions?.reduce((acc, abiFunction) => {
      //skip constructor
      if (abiFunction.name === 'constructor')
        return acc;

      return acc + this.getMethodFromAbiFunction(abiFunction);
    }, '') || '';

    const contractDeployMethod = this.getContractDeployMethod(abiData);

    this.contractFile = contractFileTemplate({
      contractName: this.contractName,
      contractFunctions,
      contractMethods,
      contractDeployMethod,
      abi: abiData.original,
    });
  }

  write() {
    fs.writeFileSync(resolve(process.cwd(), `./${DEFAULT_OUTPUT_FOLDER_NAME}/${this.contractName}.ts`), this.contractFile);
  }

  private getMethodFromAbiFunction(abiFunction: AbiFunction): string {
    const inputs = abiFunction.inputs.reduce(this.abiParamToTypeReducer, '');

    const outputs = abiFunction.outputs.reduce(this.abiParamToTypeReducer, '');

    const methodParams = !!inputs ? `{${inputs}}` : '';
    const methodReturns = !!outputs ? `{${outputs}}` : 'undefined';

    return contractMethodTemplate({
      name: abiFunction.name,
      params: methodParams,
      returns: methodReturns,
    });
  }

  private abiParamToTypeReducer = (acc: string, value: AbiParam, index: number, array: AbiParam[]) => {
    const isLast = array.length - 1 === index;
    const lastModifier = isLast ? '' : ', ';

    return acc + this.getParamFromAbiParam(value) + lastModifier;
  };

  private getParamFromAbiParam(abiParam: AbiParam): string {
    return `${abiParam.name}: ${this.getTypeFromAbiType(abiParam.type)}`;
  }

  private getTypeFromAbiType(abiType: string): string {
    switch (abiType) {
      case Types.Bytes:
        return 'BytesLike';
      case Types.BytesArray:
        return 'BytesLike';
      case Types.Cell:
        return 'BytesLike';
      case Types.Uint256:
      case Types.Uint160:
      case Types.Uint128:
      case Types.Uint64:
      case Types.Uint32:
      case Types.Uint16:
      case Types.Uint8:
      case Types.Int256:
      case Types.Int160:
      case Types.Int128:
      case Types.Int64:
      case Types.Int32:
      case Types.Int16:
      case Types.Int8:
        return 'BytesLike';
      case Types.Uint256Array:
      case Types.Uint128Array:
      case Types.Uint64Array:
      case Types.Uint32Array:
      case Types.Uint16Array:
      case Types.Uint8Array:
      case Types.Int256Array:
      case Types.Int128Array:
      case Types.Int64Array:
      case Types.Int32Array:
      case Types.Int16Array:
      case Types.Int8Array:
        return 'BytesLike';
      case Types.Bool:
        return 'boolean';
      case Types.Address:
        return 'string'
      case Types.AddressArray:
        return 'string[]';
      case Types.Tuple:
        return 'any[]';
      default:
        return 'any';
    }
  }

  private getFunctionsObject(abiData: AbiData): ContractFunctions | undefined {
    if (!abiData.abi.functions)
      return;

    const functionsObject = abiData.abi.functions.reduce((functions, item) => {
      functions[item.name] = { inputs: item.inputs || [], outputs: item.outputs || [] };

      return functions;
    }, {} as ContractFunctions);

    return functionsObject;
  }

  private getContractDeployMethod(abiData: AbiData): string {
    const constructorAbiFunction = abiData.abi.functions?.find(func => func.name === 'constructor');
    const constructorParams = constructorAbiFunction?.inputs.reduce(this.abiParamToTypeReducer, '');
    const initParams = abiData.abi.data?.reduce(this.abiParamToTypeReducer, '') || 'undefined';

    return contractDeployMethodTemplate({ constructorParams, initParams });
  }
}

export default ContractFile;
