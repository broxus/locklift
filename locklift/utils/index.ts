import fs from 'fs';
import BigNumber from 'bignumber.js';


export const loadJSONFromFile = (filePath: string): ReturnType<typeof JSON.parse> => {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};


export const loadBase64FromFile = (filePath: string): string => {
  return fs.readFileSync(filePath, 'utf8').split('\n').join('');
};


export enum Dimensions {
  Nano = 'nano',
  Ton = 'ton',
}

export const convertCrystal = (amount: number | string, dimension: Dimensions) => {
  const crystalBN = new BigNumber(amount);

  if (dimension === 'nano') {
    return crystalBN.times(10**9).toFixed(0);
  } else if (dimension === 'ton') {
    return crystalBN.div(new BigNumber(10).pow(9));
  }
};


export const getRandomNonce = (): number => Math.random() * 64000 | 0;


export const zeroAddress = '0:0000000000000000000000000000000000000000000000000000000000000000';
