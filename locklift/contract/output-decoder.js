const BigNumber = require('bignumber.js');


class OutputDecoder {
  constructor(output, functionAttributes) {
    this.output = output;
    this.functionAttributes = functionAttributes;
  }
  
  decode_value(encoded_value, schema) {
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
  
  decodeBytes(value) {
    return Buffer.from(value, 'hex');
  }
  
  decodeBytesArray(value) {
    return value.map(v => this.decodeBytes(v));
  }
  
  decodeBool(value) {
    return Boolean(value);
  }
  
  decodeInt(value) {
    return new BigNumber(value);
  }
  
  decodeIntArray(value) {
    return value.map(hexInt => this.decodeInt(hexInt));
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
  
  decodeTuple(value, schema) {
    const res_struct = {};
    
    schema.forEach((field_value_schema) => {
      const field_value = value[field_value_schema.name];
      res_struct[field_value_schema.name] = this.decode_value(field_value, field_value_schema)
    });
    
    return res_struct;
  }
}


module.exports = OutputDecoder;
