const fs = require('fs');
const BigNumber = require('bignumber.js');


const loadJSONFromFile = (filePath) => {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};


const loadBase64FromFile = (filePath) => {
  return fs.readFileSync(filePath, 'utf8').split('\n').join('');
};


const convertCrystal = (amount, dimension) => {
  const crystalBN = new BigNumber(amount);
  
  if (dimension === 'nano') {
    return crystalBN.times(10**9).toFixed(0);
  } else if (dimension === 'ton') {
    return crystalBN.div(new BigNumber(10).pow(9));
  }
};


const getRandomNonce = () => Math.random() * 64000 | 0;


const zeroAddress = '0:0000000000000000000000000000000000000000000000000000000000000000';


module.exports = {
  loadJSONFromFile,
  loadBase64FromFile,
  convertCrystal,
  getRandomNonce,
  zeroAddress,
};
