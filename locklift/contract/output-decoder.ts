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

  private decode_value(encoded_value: any, schema: AbiParam): any {
    switch (schema.type) {
      case Types.Bytes:
        return this.decodeBytes(encoded_value);
      case Types.BytesArray:
        return this.decodeBytesArray(encoded_value);
      case Types.Cell:
        return encoded_value;
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
        return this.decodeInt(encoded_value);
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
        return this.decodeIntArray(encoded_value);
      case Types.Bool:
        return this.decodeBool(encoded_value);
      case Types.Address:
      case Types.AddressArray:
        return encoded_value;
      case Types.Tuple:
        return this.decodeTuple(encoded_value, schema.components);
      default:
        return encoded_value;
    }
  }

  private decodeBytes(value: string): Buffer {
    return Buffer.from(value, 'hex');
  }

  private decodeBytesArray(value: string[]): Buffer[] {
    return value.map(v => this.decodeBytes(v));
  }

  private decodeBool(value: string): boolean {
    return Boolean(value);
  }

  private decodeInt(value: string): BigNumber {
    return new BigNumber(value);
  }

  private decodeIntArray(value: string[]): BigNumber[] {
    return value.map(hexInt => this.decodeInt(hexInt));
  }

  private decodeTuple(value: Record<string, any>, schema?: AbiParam[]): Record<string, any> {
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
