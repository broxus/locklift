# Compilation Artifacts

In the context of Locklift, the process of generating artifacts is a bit different compared to systems like Hardhat. The main artifacts that you get when working with Locklift are:

1. **TVC (TVM Container)** - The TVC file is a binary representation of a compiled smart contract in the TVM format. It's used when deploying smart contracts to the blockchain. It stores the contract's code and data in a compact binary form, suitable for execution on the TVM.

2. **Code (Base64)** - This base64 encoded contract code is converted to a TVC file using `codeToTvc` method before deploying the contract.

3. **ABI** - The ABI (Application Binary Interface) contains the specification of the smart contract's functions that can be called, their input and output parameters. This enables programs and developers to know how to interact with the contract.

4. **CodeHash** - This is a unique hash created based on the smart contract's code.

After compilation, each of these artifacts is stored in the build directory (`build`) as follows:

- `build/Sample.tvc`
- `build/Sample.code`
- `build/Sample.abi.json`
- `build/Sample.base64`

## Directory Structure

The `build` directory in Locklift does not follow the original directory structure of the contracts. Instead, it compiles all contracts from all directories into a single directory. So, if your contracts are arranged like this:

```
contracts
├── Sample.tsol
└── test
    └── Sample2.tsol
```

Then, the structure of your `build` directory will look like this:

```
build
├── Sample.tvc
├── Sample.code
├── Sample.abi.json
├── Sample.base64
├── Sample2.tvc
├── Sample2.code
├── Sample2.abi.json
├── Sample2.base64
└── factorySource.ts
```

Each .tsol file in your source will produce four files in the `build` directory: .tvc, .code, .abi.json, and .base64. For example, `Sample.tsol` will produce `Sample.tvc`, `Sample.code`, `Sample.abi.json`, and `Sample.base64`.

Locklift cannot handle situations where two contracts have the same file name. Therefore, each contract should have a unique name to prevent conflicts.

The `build` directory also includes a `factorySource.ts` file. This file exports the ABI of each contract as a TypeScript constant, which can be imported into other scripts:

```typescript
const sampleAbi = {
  ABIversion: 2,
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
    { name: 'multiplyState', inputs: [], outputs: [] },
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
    { name: 'SS', inputs: [], outputs: [] },
  ],
  fields: [
    { name: '_pubkey', type: 'uint256' },
    { name: '_timestamp', type: 'uint64' },
    { name: '_constructorFlag', type: 'bool' },
    { name: '_nonce', type: 'uint16' },
    { name: 'state', type: 'uint256' },
  ],
} as const;

export const factorySource = {
  Sample: sampleAbi,
} as const;

export type FactorySource = typeof factorySource;
export type SampleAbi = typeof sampleAbi;
```

The `factorySource.ts` file can be thought of as a map, connecting contract names to their respective ABIs, facilitating the interaction with different contracts in your project.

## Retrieving Artifacts

The `locklift.factory.getContractArtifacts` method is utilized to retrieve these artifacts based on the .tsol or .sol file name, or the name from `config.extarnalContracts[pathToLib]`.

This will look something like this:

```typescript
const sampleData = locklift.factory.getContractArtifacts('Sample');
```

:::details SampleData

```typescript
{
  "tvc": "te6ccgECFwEAAowAAgE0AwEBAcACAEPQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgBCSK7VMg4wMgwP/jAiDA/uMC8gsUBQQWArbtRNDXScMB+GYh2zzTAAGOGYMI1xgg+QEB0wABlNP/AwGTAvhC4vkQ8qiV0wAB8nri0z8B+EMhufK0IPgjgQPoqIIIG3dAoLnytPhj0x8B+CO88rnTHwHbPPI8CAYDSu1E0NdJwwH4ZiLQ1wsDqTgA3CHHAOMCIdcNH/K8IeMDAds88jwTEwYEUCCCECBivBq64wIgghAumE3guuMCIIIQMWgC1rrjAiCCEDyR4cW64wIPDAkHAzYw+EJu4wD4RvJzIZPU0dDe0//R+ADbPNs88gAIDg0BYu1E0NdJwgGOJnDtRND0BXEhgED0Dm+Rk9cLD95w+Gv4aoBA9A7yvdcL//hicPhj4w0SAyYw+Eby4Ez4Qm7jANHbPDDbPPIAEgoNAVL4APhLpwIg+GuNBHAAAAAAAAAAAAAAAAAYzsxqIMjOy//JcPsAiHD7AAsAIsAAAAAAAAAAAAAAAABjpvM1AzYw+Eby4Ez4Qm7jACGT1NHQ3tP/0ds8MNs88gASDg0ALPhL+Er4Q/hCyMv/yz/Pg8sPy//J7VQAQvgAIPhrjQRwAAAAAAAAAAAAAAAAGM7MaiDIzsv/yXD7AANoMPhG8uBM+EJu4wDR2zwhjhwj0NMB+kAwMcjPhyDOghCgYrwazwuBy//JcPsAkTDi4wDyABIREAAo7UTQ0//TPzH4Q1jIy//LP87J7VQABPhLAC7tRNDT/9M/0wAx0w/T/9H4a/hq+GP4YgAK+Eby4EwCCvSkIPShFhUAFHNvbCAwLjYyLjAAAA==",

  "code": "te6ccgECFAEAAl8ABCSK7VMg4wMgwP/jAiDA/uMC8gsRAgETArbtRNDXScMB+GYh2zzTAAGOGYMI1xgg+QEB0wABlNP/AwGTAvhC4vkQ8qiV0wAB8nri0z8B+EMhufK0IPgjgQPoqIIIG3dAoLnytPhj0x8B+CO88rnTHwHbPPI8BQMDSu1E0NdJwwH4ZiLQ1wsDqTgA3CHHAOMCIdcNH/K8IeMDAds88jwQEAMEUCCCECBivBq64wIgghAumE3guuMCIIIQMWgC1rrjAiCCEDyR4cW64wIMCQYEAzYw+EJu4wD4RvJzIZPU0dDe0//R+ADbPNs88gAFCwoBYu1E0NdJwgGOJnDtRND0BXEhgED0Dm+Rk9cLD95w+Gv4aoBA9A7yvdcL//hicPhj4w0PAyYw+Eby4Ez4Qm7jANHbPDDbPPIADwcKAVL4APhLpwIg+GuNBHAAAAAAAAAAAAAAAAAYzsxqIMjOy//JcPsAiHD7AAgAIsAAAAAAAAAAAAAAAABjpvM1AzYw+Eby4Ez4Qm7jACGT1NHQ3tP/0ds8MNs88gAPCwoALPhL+Er4Q/hCyMv/yz/Pg8sPy//J7VQAQvgAIPhrjQRwAAAAAAAAAAAAAAAAGM7MaiDIzsv/yXD7AANoMPhG8uBM+EJu4wDR2zwhjhwj0NMB+kAwMcjPhyDOghCgYrwazwuBy//JcPsAkTDi4wDyAA8ODQAo7UTQ0//TPzH4Q1jIy//LP87J7VQABPhLAC7tRNDT/9M/0wAx0w/T/9H4a/hq+GP4YgAK+Eby4EwCCvSkIPShExIAFHNvbCAwLjYyLjAAAA==",

  "abi": {
    "ABI version": 2,
    "version": "2.2",
    "header": [
      "pubkey",
      "time",
      "expire"
    ],
    "functions": [
      {
        "name": "constructor",
        "inputs": [
          {
            "name": "_state",
            "type": "uint256"
          }
        ],
        "outputs": []
      },
      {
        "name": "setState",
        "inputs": [
          {
            "name": "_state",
            "type": "uint256"
          }
        ],
        "outputs": []
      },
      {
        "name": "multiplyState",
        "inputs": [],
        "outputs": []
      },
      {
        "name": "getDetails",
        "inputs": [],
        "outputs": [
          {
            "name": "_state",
            "type": "uint256"
          }
        ]
      }
    ],
    "data": [
      {
        "key": 1,
        "name": "_nonce",
        "type": "uint16"
      }
    ],
    "events": [
      {
        "name": "StateChange",
        "inputs": [
          {
            "name": "_state",
            "type": "uint256"
          }
        ],
        "outputs": []
      },
      {
        "name": "SS",
        "inputs": [],
        "outputs": []
      }
    ],
    "fields": [
      {
        "name": "_pubkey",
        "type": "uint256"
      },
      {
        "name": "_timestamp",
        "type": "uint64"
      },
      {
        "name": "_constructorFlag",
        "type": "bool"
      },
      {
        "name": "_nonce",
        "type": "uint16"
      },
      {
        "name": "state",
        "type": "uint256"
      }
    ]
  },
  "codeHash": "3a7d275574f1ae44ec0e17cbd56f5d996dd55515064e5db6a8f2889a1b5f19c8"
}

```

:::
