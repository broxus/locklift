import { Transaction } from 'everscale-inpage-provider';
import { toast } from './toast';

export const testContract = {
  address: `0:25eeaaf295e4559808b93a5bcd5791f3aa969c1dd61ced5e5e1df0e349573b35`,
  dublicateAddress: `0:ce58a5340674998f7dbbc4e796aca41c30eb5c72abaa6e5cd5a44b3e79dfcf02`,
  ABI: {
    'ABI version': 2,
    version: '2.2',
    header: ['pubkey', 'time', 'expire'],
    functions: [
      {
        name: 'constructor',
        inputs: [{ name: '_state', type: 'uint256' }],
        outputs: [],
      },
      {
        name: 'setState',
        inputs: [{ name: '_state', type: 'uint256' }],
        outputs: [],
      },
      {
        name: 'setOtherState',
        inputs: [
          { name: 'other', type: 'address' },
          { name: '_state', type: 'uint256' },
          { name: 'count', type: 'uint256' },
        ],
        outputs: [],
      },
      {
        name: 'increaseState',
        inputs: [{ name: 'count', type: 'uint256' }],
        outputs: [],
      },
      {
        name: 'emitEvent',
        inputs: [{ name: 'value', type: 'uint256' }],
        outputs: [],
      },
      {
        name: 'getDetails',
        inputs: [],
        outputs: [{ name: '_state', type: 'uint256' }],
      },
    ],
    data: [{ key: 1, name: '_nonce', type: 'uint16' }],
    events: [
      {
        name: 'StateChange',
        inputs: [{ name: '_state', type: 'uint256' }],
        outputs: [],
      },
      {
        name: 'SomeEvent',
        inputs: [{ name: 'value', type: 'uint256' }],
        outputs: [],
      },
    ],
    fields: [
      { name: '_pubkey', type: 'uint256' },
      { name: '_timestamp', type: 'uint64' },
      { name: '_constructorFlag', type: 'bool' },
      { name: '_nonce', type: 'uint16' },
      { name: 'state', type: 'uint256' },
    ],
  } as const,
  base64: `te6ccgECHgEAA/EAAgE0AwEBAcACAEPQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgBCSK7VMg4wMgwP/jAiDA/uMC8gsbBwQdAQAFA/7tRNDXScMB+GaNCGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAT4aSHbPNMAAY4ZgwjXGCD5AQHTAAGU0/8DAZMC+ELi+RDyqJXTAAHyeuLTPwH4QyG58rQg+COBA+iogggbd0CgufK0+GPTHwH4I7zyudMfAds8DQgGAATyPANS7UTQ10nDAfhmItDTA/pAMPhpqTgA3CHHAOMCIdcNH/K8IeMDAds88jwaGggCKCCCEC6YTeC74wIgghBLKEEKu+MCDgkCKCCCEDyR4cW64wIgghBLKEEKuuMCDAoDNjD4RvLgTPhCbuMAIZPU0dDe0//R2zww2zzyABYLFACW+CdvEGim/mChtX9y+wJwk1MBuY4j+EukIPhrjQRwAAAAAAAAAAAAAAAAGM7MaiDIzsv/yXD7AKToW/hJyM+FiM6Ab89AyYEAgfsAAjYw+EJu4wD4RvJzIZPU0dDe0//R+AD4a9s88gANFAFi7UTQ10nCAY4mcO1E0PQFcSGAQPQOb5GT1wsP3nD4a/hqgED0DvK91wv/+GJw+GPjDRYEUCCCEAe5t8q64wIgghAWO9WKuuMCIIIQIGK8GrrjAiCCEC6YTeC64wIXExEPAzYw+Eby4Ez4Qm7jACGT1NHQ3tP/0ds8MNs88gAWEBQAfPgnbxBopv5gobV/cvsCIPhrjQRwAAAAAAAAAAAAAAAAGM7MaiDIzsv/yXD7APhJyM+FiM6Ab89AyYEAgfsAA2gw+Eby4Ez4Qm7jANHbPCGOHCPQ0wH6QDAxyM+HIM6CEKBivBrPC4HL/8lw+wCRMOLjAPIAFhIYAAT4SwNEMPhG8uBM+EJu4wAhk9TR0N76QNP/1NHQ0//R2zww2zzyABYVFAAs+Ev4SvhD+ELIy//LP8+Dyw/L/8ntVACo+CdvEGim/mChtX9y+wIB+GsBcMjPhYDKAM+EQM6CgCBfXhAAAAAAAAAAAAAAAAAAAc8LjgHIz5EsoQQqy//NyXL7APhJyM+FiM6Ab89AyYEAgfsAAC7tRNDT/9M/0wAx0w/T/9H4a/hq+GP4YgIqMPhG8uBMIZPU0dDe0//R2zzjAPIAGRgAKO1E0NP/0z8x+ENYyMv/yz/Oye1UAHb4J28QaKb+YKG1f3L7Ao0EcAAAAAAAAAAAAAAAAAlxU1+gyM7L/8lw+wD4ScjPhYjOgG/PQMmBAIH7AAAK+Eby4EwCCvSkIPShHRwAFHNvbCAwLjYyLjAAAA==`,
  boc: `te6ccgECJAEABTQAAm/ABa6sNOewgryrkdU0TOaY1mC6iKaQKSjzR+vis5Uw53fCxpe/QyQJvEgAAEI95RgZCQ63LPjTQAMBAYH75REAFUvBLZJpkF0vmqrqdViKtDmo+RH9WirettK1pwAAAYiYwOcZgAB13wAAAAAAAAAAAAAAAAAAAfQAAAAAQAIACHRlc3QEJIrtUyDjAyDA/+MCIMD+4wLyCyEFBCMC3O1E0NdJwwH4Zo0IYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABPhpIds80wABjhSDCNcYIPgoyM7OyfkAWPhC+RDyqN7TPwH4QyG58rQg+COBA+iogggbd0CgufK0+GPTHwHbPPI8CwYDeu1E0NdJwwH4ZiLQ0wP6QDD4aak4APhEf29xggiYloBvcm1vc3BvdPhk3CHHAOMCIdcNH/K8IeMDAds88jwgIAYCKCCCEEE+2su74wIgghBxCWtKu+MCDgcDPCCCEGcHYA664wIgghBuv1bSuuMCIIIQcQlrSrrjAgwKCANyMPhG8uBM+EJu4wDR2zwhjiEj0NMB+kAwMcjPhyDOghDxCWtKzwuBAW8iAssfzMlw+wCRMOLjAPIAHwkdAAT4TAJIMPhCbuMA+Ebyc9N/1NH4ACH4awGBA+ipCLUfAW8C+GzbPPIACxECbu1E0NdJwgGOrHDtRND0BXEhgED0Dm+Rk9cLH95wIIhvAvhs+Gv4aoBA9A7yvdcL//hicPhj4w0jHwMoMPhG8uBM+EJu4wDTf9HbPNs88gAfDREBQvgnbxBopv5gobV/cvsC2zz4ScjPhYjOgG/PQMmBAIH7ABMEUCCCEBE3DgC64wIgghA/4WgVuuMCIIIQQAIvcrrjAiCCEEE+2su64wIcFBAPAVAw0ds8+EshjhyNBHAAAAAAAAAAAAAAAAAwT7ay4MjOy3/JcPsA3vIAHwMoMPhG8uBM+EJu4wDTf9HbPNs88gAfEhEAPvhM+Ev4SvhD+ELIy//LP8+Dyx/LfwFvIgLLH8zJ7VQBCPgA2zwTAGYg+GuBA+ipCLUf+EwBb1Ag+GyNBHAAAAAAAAAAAAAAAAAUznIpYMjOAW8iAssfzMlw+wADaDD4RvLgTPhCbuMA1NHbPCGOGyPQ0wH6QDAxyM+HIM6CEL/haBXPC4HMyXD7AJEw4uMA8gAfFR0BDPhMbxHbPBYEPAHbPFjQXzLbPDMzlCBx10aOiNUxXzLbPDMz6DDbPBoZGRcBJJYhb4jAALOOhiHbPDPPEejJMRgAHG+Nb41ZIG+Ikm+MkTDiAVIhzzWm+SHXSyCWI3Ai1zE03jAhu46NXNcYMyPOM13bPDTIM99TEs5sMRsBMG8AAdCVINdKwwCOidUByM5SINs8MujIzhsAOFEQb4ieb40gb4iEB6GUb4xvAN+SbwDiWG+Mb4wD8DD4RvLgTPhCbuMA0x/4RFhvdfhk0x/R2zwhjh8j0NMB+kAwMcjPhyDOghCRNw4AzwuBAW8iAssfzMlwjjT4RCBvEyFvEvhJVQJvEcjPhIDKAM+EQM4B+gL0AIBqz0D4RG8VzwsfAW8iAssfzMn4RG8U4vsA4wDyAB8eHQAo7UTQ0//TPzH4Q1jIy//LP87J7VQBWiCBA+i58uU5+ExvEKC1H3CIbwIBb1D4TG8Rb1Ew+ERwb3KARG90cG9x+GT4TCMAQO1E0NP/0z/TADHTH9N/0x/UWW8CAdH4bPhr+Gr4Y/hiAAr4RvLgTAIQ9KQg9L3ywE4jIgAUc29sIDAuNjYuMAAA`,
};

export const loadBase64FromFile = async (filePath: string) => {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load file: ${response.statusText}`);
    }
    const text = await response.text();

    return text.split('\n').join('');
  } catch (e) {
    return undefined;
  }
};

export const tryLoadTvcFromFile = async (filePath: string) => {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load file: ${response.statusText}`);
    }

    return await response.text();
  } catch (e) {
    return undefined;
  }
};

export const toNano = (value: number) => String(value * 1e9);

export const errorExtractor = async <
  T extends { transaction: Transaction; output?: Record<string, unknown> }
>(
  transactionResult: Promise<T>
): Promise<T> => {
  return transactionResult.then(res => {
    if (res.transaction.aborted) {
      throw {
        message: `Transaction aborted with code ${res.transaction.exitCode}`,
        name: 'TransactionAborted',
        transaction: res,
      };
    }

    return res;
  });
};

export const txResultToast = (txResult: Transaction) => {
  if (txResult.aborted) {
    toast(`Transaction aborted with code ${txResult.exitCode}`, 0);
  } else {
    toast(`Message sent`, 1);
  }
};
export * from './toast';
