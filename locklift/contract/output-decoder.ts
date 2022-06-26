import BigNumber from 'bignumber.js';
import { AbiFunction, AbiParam } from '@tonclient/core';


export enum Types {
  Bytes = 'bytes',
  BytesArray = 'bytes[]',
  Cell = 'cell',
  Uint256 = 'uint256',
  Uint160 = 'uint160',
  Uint128 = 'uint128',
  Uint64 = 'uint64',
  Uint32 = 'uint32',
  Uint16 = 'uint16',
  Uint8 = 'uint8',
  Int256 = 'int256',
  Int160 = 'int160',
  Int128 = 'int128',
  Int64 = 'int64',
  Int32 = 'int32',
  Int16 = 'int16',
  Int8 = 'int8',
  Uint256Array = 'uint256[]',
  Uint128Array = 'uint128[]',
  Uint64Array  = 'uint64[]',
  Uint32Array  = 'uint32[]',
  Uint16Array  = 'uint16[]',
  Uint8Array  = 'uint8[]',
  Int256Array = 'int256[]',
  Int128Array = 'int128[]',
  Int64Array = 'int64[]',
  Int32Array = 'int32[]',
  Int16Array = 'int16[]',
  Int8Array = 'int8[]',
  Bool = 'bool',
  Address = 'address',
  AddressArray = 'address[]',
  Tuple = 'tuple',
}

class OutputDecoder {
  private functionAttributes: AbiFunction;
  private output: any;

  constructor(output: any, functionAttributes: AbiFunction) {
    this.output = output;
    this.functionAttributes = functionAttributes;
  }

  decode() {
    const outputDecoded = this.decodeTuple(
      this.output,
      this.functionAttributes.outputs
    );

    // Return single output without array notation
    if (Object.keys(outputDecoded).length === 1) {
      return Object.values(outputDecoded)[0];
    }

    return outputDecoded;
  }

  private decode_value(encoded_value: any, schema: AbiParam) {
    switch (schema.type) {
      case 'bytes':
        return this.decodeBytes(encoded_value);
      case 'bytes[]':
        return this.decodeBytesArray(encoded_value);
      case 'cell':
        return encoded_value;
      case 'uint256':
      case 'uint160':
      case 'uint128':
      case 'uint64':
      case 'uint32':
      case 'uint16':
      case 'uint8':
      case 'int256':
      case 'int160':
      case 'int128':
      case 'int64':
      case 'int32':
      case 'int16':
      case 'int8':
        return this.decodeInt(encoded_value);
      case 'uint256[]':
      case 'uint128[]':
      case 'uint64[]':
      case 'uint32[]':
      case 'uint16[]':
      case 'uint8[]':
      case 'int256[]':
      case 'int128[]':
      case 'int64[]':
      case 'int32[]':
      case 'int16[]':
      case 'int8[]':
        return this.decodeIntArray(encoded_value);
      case 'bool':
        return this.decodeBool(encoded_value);
      case 'address':
      case 'address[]':
        return encoded_value;
      case 'tuple':
        return this.decodeTuple(encoded_value, schema.components);
      default:
        return encoded_value;
    }
  }

  private decodeBytes(value: string) {
    return Buffer.from(value, 'hex');
  }

  private decodeBytesArray(value: string[]) {
    return value.map(v => this.decodeBytes(v));
  }

  private decodeBool(value: string) {
    return Boolean(value);
  }

  private decodeInt(value: string) {
    return new BigNumber(value);
  }

  private decodeIntArray(value: string[]) {
    return value.map(hexInt => this.decodeInt(hexInt));
  }

  private decodeTuple(value: Record<string, any>, schema?: AbiParam[]) {
    const res_struct: Record<string, any> = {};

    if (schema) {
      schema.forEach((field_value_schema) => {
        const field_value = value[field_value_schema.name];
        res_struct[field_value_schema.name] = this.decode_value(field_value, field_value_schema)
      });
    }

    return res_struct;
  }
}


export default OutputDecoder;
