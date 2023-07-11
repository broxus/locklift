# Compiling Contracts

## Locklift Build

To compile your contracts in your Locklift project, use the built-in build command:

```bash
npx locklift build
```

This command uses the specified TON Solidity compiler and TVM linker to build all contracts in the `contracts/` directory by default. The built files will be placed in the `build/` directory by default and should include the following files:

- `Sample.tvc`
- `Sample.code`
- `Sample.base64`
- `Sample.abi.json`
- `factorySource.ts`

### Build Command Options

The `build` command in Locklift provides several options that you can utilize to customize the behavior of the command:

- `-c, --contracts <contracts>`: This option allows you to specify a custom path to the contracts folder. By default, this is set to "contracts".

  Example:

  ```bash
  npx locklift build --contracts /custom/path/to/contracts
  ```

- `-b, --build <build>`: This option allows you to specify a custom path to the build folder. By default, this is set to "build".

  Example:

  ```bash
  npx locklift build --build /custom/path/to/build
  ```

- `--disable-include-path`: This option disables including node_modules. Use this with old compiler versions. By default, this is set to false.

  Example:

  ```bash
  npx locklift build --disable-include-path
  ```

- `--config <config>`: This option allows you to specify a custom path to the config file. By default, this is set to "locklift.config.ts".

  Example:

  ```bash
  npx locklift build --config /custom/path/to/config
  ```

## Configuring the Compiler

If you need to customize the Solidity compiler options, you can do so through the `compiler` field in your `locklift.config.js`. Here is an example of how to set the compiler version:

```javascript
const config = {
  compiler: {
    version: '0.62.0',
  },
  linker: {
    version: '0.15.48',
  },
};
```

In this example, the versions of the TON Solidity compiler and TVM linker are specified. If any of your contracts have a version pragma that is not satisfied by the compiler version you configured, then Locklift will throw an error.

You can also specify the path to your TON Solidity Compiler and TVM linker if you have them locally. Here's an example:

```javascript
const config = {
  compiler: {
    path: '/path/to/your/TON-Solidity-Compiler',
  },
  linker: {
    lib: '/path/to/your/stdlib_sol.tvm',
    path: '/path/to/your/tvm_linker',
  },
};
```

In this example, the paths to the TON Solidity Compiler and TVM linker are specified, as well as the path to the stdlib.

Finally, for external contracts, you can specify a path to the build files. Here's an example:

```javascript
const config = {
  compiler: {
    version: '0.62.0',
    externalContracts: {
      'node_modules/path_to_contracts/build': [
        'ContractName1',
        'ContractName2',
      ],
    },
  },
  linker: {
    version: '0.15.48',
  },
};
```

In this example, the paths to the external contract build files are specified, along with the names of the contracts.

## FactorySource

The `factorySource.ts` file forms an integral part of the Locklift framework, automatically crafted during the build process. This file includes TypeScript type definitions and ABIs for every smart contract in your project, thereby enhancing contract interaction and type safety.

Consider this simple example of a `factorySource.ts`:

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

In this sample, `sampleAbi` represents the ABI of a "Sample" contract. It's exported within an object, connecting contract names with their corresponding ABIs. The `FactorySource` type signifies a TypeScript type that matches the structure of the exported object, while `SampleAbi` describes the ABI of the "Sample" contract as a TypeScript type.

The file itself streamlines the process of contract deployment and interaction by mapping out their structure. During the build process, all `.abi.json` files are scanned, TypeScript types and ABIs are generated for each contract, and this data is compiled into the file.
