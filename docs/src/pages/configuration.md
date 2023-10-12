---
outline: deep
---

# Configuration

Locklift uses a configuration file named `locklift.config.ts` by default. This file is crucial for setting up your Locklift environment and specifying how your project will interact with different networks.

Here's an expanded layout of a `locklift.config.ts` file with more detailed configuration options:

```typescript
import { LockliftConfig } from 'locklift';
import { FactorySource } from './build/factorySource';

declare global {
  const locklift: import('locklift').Locklift<FactorySource>;
}

const LOCAL_NETWORK_ENDPOINT =
  process.env.NETWORK_ENDPOINT || 'http://localhost/graphql';
const DEV_NET_NETWORK_ENDPOINT =
  process.env.DEV_NET_NETWORK_ENDPOINT ||
  'https://devnet-sandbox.evercloud.dev/graphql';

const VENOM_TESTNET_ENDPOINT =
  process.env.VENOM_TESTNET_ENDPOINT ||
  'https://jrpc-devnet.venom.foundation/';
const VENOM_TESTNET_TRACE_ENDPOINT =
  process.env.VENOM_TESTNET_TRACE_ENDPOINT ||
  'https://gql-devnet.venom.network/graphql';

// Create your own link on https://dashboard.evercloud.dev/
const MAIN_NET_NETWORK_ENDPOINT =
  process.env.MAIN_NET_NETWORK_ENDPOINT ||
  'https://mainnet.evercloud.dev/XXX/graphql';

const config: LockliftConfig = {
  compiler: {
    // Specify path to your TON-Solidity-Compiler
    // path: "/mnt/o/projects/broxus/TON-Solidity-Compiler/build/solc/solc",

    // Or specify version of compiler
    version: '0.62.0',

    // Specify config for external contracts as in example
    // externalContracts: {
    //   "node_modules/broxus-ton-tokens-contracts/build": ['TokenRoot', 'TokenWallet']
    // }
  },
  linker: {
    // Specify path to your stdlib
    // lib: "/mnt/o/projects/broxus/TON-Solidity-Compiler/lib/stdlib_sol.tvm",
    // // Specify path to your Linker
    // path: "/mnt/o/projects/broxus/TVM-linker/target/release/tvm_linker",

    // Or specify version of linker
    version: '0.15.48',
  },
  networks: {
    local: {
      // Specify connection settings for https://github.com/broxus/everscale-standalone-client/
      connection: {
        id: 1,
        group: 'localnet',
        type: 'graphql',
        data: {
          endpoints: [LOCAL_NETWORK_ENDPOINT],
          latencyDetectionInterval: 1000,
          local: true,
        },
      },
      // This giver is default local-node giverV2
      giver: {
        // Check if you need provide custom giver
        address:
          '0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415',
        key: '172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3',
      },
      tracing: {
        endpoint: LOCAL_NETWORK_ENDPOINT,
      },
      keys: {
        // Use everdev to generate your phrase
        // !!! Never commit it in your repos !!!
        phrase:
          'action inject penalty envelope rabbit element slim tornado dinner pizza off blood',
        amount: 20,
      },
    },
    // Other networks...
  },
  mocha: {
    timeout: 2000000,
  },
};
```

## Compiler

The `compiler` field in the configuration is used to set the version of the compiler that you're using. You can also specify a path to your TON-Solidity-Compiler, or specify config for external contracts.

```typescript
compiler: {
  // Specify path to your TON-Solidity-Compiler
  path: "/mnt/o/projects/broxus/TON-Solidity-Compiler/build/solc/solc",

  // Or specify version of compiler
  version: "0.62.0",

  // Specify config for extarnal contracts as in exapmple
  externalContracts: {
    "node_modules/@broxus/tip3/build": ["TokenRoot", "TokenWallet"],
  },
},
```

#### External Contracts

The `externalContracts` field in the compiler configuration is used to specify paths to external contracts that you want to use in your project. This can be useful when you want to use pre-built contracts rather than writing them from scratch.

For example, if you want to use token contracts from the `@broxus/tip3` repository, you can specify the path to the build directory of that repository and the names of the contracts you want to use:

```typescript
externalContracts: {
  "node_modules/@broxus/tip3/build": ["TokenRoot", "TokenWallet"],
},
```

Then, you can import these contracts in your contract code as follows:

```solidity
import '@broxus/contracts/contracts/utils/RandomNonce.sol';

import "@broxus/tip3/contracts/interfaces/IAcceptTokensTransferCallback.sol";
import "@broxus/tip3/contracts/interfaces/IAcceptTokensMintCallback.sol";
import "@broxus/tip3/contracts/interfaces/IBounceTokensTransferCallback.sol";

import "../libraries/GitcoinErrors.sol";

contract MyContract is RandomNonce, IAcceptTokensTransferCallback, IAcceptTokensMintCallback, IBounceTokensTransferCallback { }
```

## Linker

The `linker` field is used to specify the version of the linker. You can also specify a path to your stdlib or Linker.

```typescript
linker: {
  // Specify path to your stdlib
  // lib: "/mnt/o/projects/broxus/TON-Solidity-Compiler/lib/stdlib_sol.tvm",
  // // Specify path to your Linker
  // path: "/mnt/o/projects/broxus/TVM-linker/target/release/tvm_linker",

  // Or specify version of linker
  version: "0.15.48",
},
```

## Networks

The `networks` field allows you to specify the different networks that you'll be connecting to. Each network that you're using must be defined separately, with its own connection, giver, and keys.

In addition to the networks you define, Locklift comes bundled with a built-in network called Locklift, a local TVM network node designed for development. By default, if you're using Locklift, then you're already using the Locklift network. When Locklift executes your tests, scripts, or tasks, an in-process Locklift network node is started automatically.

:::tip
For more information about the Locklift network, see the [Locklift Networks](/locklift-network/overview.md) page.
:::

```typescript
networks: {
  locklift: {
    connection: {
      id: 1001,
      // @ts-ignore
      type: "proxy",
      // @ts-ignore
      data: {},
    },
    keys: {
      // Use everdev to generate your phrase
      // !!! Never commit it in your repos !!!
      phrase: "action inject penalty envelope rabbit element slim tornado dinner pizza off blood",
      amount: 20,
    },
  },
  local: {
    // Specify connection settings for https://github.com/broxus/everscale-standalone-client/
    connection: {
      id: 1,
      group: "localnet",
      type: "graphql",
      data: {
        endpoints: [LOCAL_NETWORK_ENDPOINT],
        latencyDetectionInterval: 1000,
        local: true,
      },
    },
    keys: {
      // Use everdev to generate your phrase
      // !!! Never commit it in your repos !!!
      // phrase: "action inject penalty envelope rabbit element slim tornado dinner pizza off blood",
      amount: 20,
    },
  },
  test: {
    connection: {
      id: 1,
      type: "graphql",
      group: "dev",
      data: {
        endpoints: [DEV_NET_NETWORK_ENDPOINT],
        latencyDetectionInterval: 1000,
        local: false,
      },
    },
    keys: {
      // Use everdev to generate your phrase
      // !!! Never commit it in your repos !!!
      // phrase: "action inject penalty envelope rabbit element slim tornado dinner pizza off blood",
      amount: 20,
    },
  },
  venom_testnet: {
    connection: {
      id: 1000,
      type: "jrpc",
      group: "dev",
      data: {
        endpoint: VENOM_TESTNET_ENDPOINT,
      },
    },
    giver: {
      address: "0:0000000000000000000000000000000000000000000000000000000000000000",
      phrase: "phrase",
      accountId: 0,
    },
    keys: {
      // Use everdev to generate your phrase
      // !!! Never commit it in your repos !!!
      // phrase: "action inject penalty envelope rabbit element slim tornado dinner pizza off blood",
      amount: 20,
    },
  },
  main: {
    // Specify connection settings for https://github.com/broxus/everscale-standalone-client/
    connection: {
      id: 1,
      type: "graphql",
      group: "main",
      data: {
        endpoints: [MAIN_NET_NETWORK_ENDPOINT],
        latencyDetectionInterval: 1000,
        local: false,
      },
    },
    keys: {
      // Use everdev to generate your phrase
      // !!! Never commit it in your repos !!!
      // phrase: "action inject penalty envelope rabbit element slim tornado dinner pizza off blood",
      amount: 20,
    },
  },
}
```

### Connection

The `connection` field within each network configuration allows you to specify the settings for connecting to that network. There are two types of transport that you can use: `graphql` and `jrpc`. The configuration for each type of transport looks like this:

::: code-group

```typescript [graphql]
connection: {
  id: 1,
  group: "localnet",
  type: "graphql",
  data: {
    endpoints: [LOCAL_NETWORK_ENDPOINT],
    latencyDetectionInterval: 1000,
    local: true,
  },
},
```

```typescript [jrpc]
connection: {
  id: 1,
  type: 'jrpc',
  group: 'main',
  data: {
    endpoint: process.env.MAINNET_RPC_NETWORK_ENDPOINT ?? '',
  },
},
```

:::

### Giver

The Giver module in Locklift is akin to a specialized smart contract designed with the specific role of distributing tokens. In the context of a local node (sandbox), a preset Giver exists, already equipped with native tokens for your convenience. The `giver` field within each network configuration allows you to specify the settings for the giver for that network.

All known wallets and givers such as `EverWallet` or `GiverV2` (from local node) will be detected automatically. You only need to provide giver credentials - (address, secret key, or phrase with account id). If you want to use something custom you will need to provide a `giverFactory` callback for `networks.giver.giverFactory` that callback should return something that implements the `Giver` interface.

One of the key functionalities offered by the `TestnetGiver` is a `sendTo` method, defined via a specified ABI:

```typescript
declare const testnetGiverAbi: {
  readonly 'ABI version': 2;
  readonly header: readonly ['pubkey', 'time', 'expire'];
  readonly functions: readonly [
    {
      readonly name: 'sendGrams';
      readonly inputs: readonly [
        {
          readonly name: 'dest';
          readonly type: 'address';
        },
        {
          readonly name: 'amount';
          readonly type: 'uint64';
        }
      ];
      readonly outputs: readonly [];
    }
  ];
  readonly events: readonly [];
};
```

The `sendGrams` function is central to the Giver module. It facilitates the token transfer process from the Giver to any specified address.

#### Example of a Custom Giver

You can also create a custom giver. Here's an example of a custom giver found on GitHub:

```typescript
giver: {
  giverFactory: (ever, keyPair, address) => new SimpleGiver(ever, keyPair, address),
  address: "0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415",
  key: "172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3",
},
```

And the `SimpleGiver` class:

```typescript
import {
  Address,
  Contract,
  Giver,
  ProviderRpcClient,
  Transaction,
} from 'locklift';
import { Ed25519KeyPair } from 'everscale-standalone-client';

// Reimplements this class if you need to use custom giver contract
export class SimpleGiver implements Giver {
  public giverContract: Contract<typeof giverAbi>;

  constructor(
    ever: ProviderRpcClient,
    readonly keyPair: Ed25519KeyPair,
    address: string
  ) {
    const giverAddr = new Address(address);
    this.giverContract = new ever.Contract(giverAbi, giverAddr);
  }

  public async sendTo(
    sendTo: Address,
    value: string
  ): Promise<{ transaction: Transaction; output?: {} }> {
    return this.giverContract.methods
      .sendTransaction({
        value: value,
        dest: sendTo,
        bounce: false,
      })
      .sendExternal({ publicKey: this.keyPair.publicKey });
  }
}
```

This `SimpleGiver` class is a reimplementation of the Giver interface and can be used to create a custom giver contract. It includes a `sendTo` method that sends a transaction to a specified address.

### Keys

The `keys` field within each network configuration allows you to specify settings for the keys that will be used when interacting with that network. The phrase used here is utilized by the Keystore module to deterministically generate pairs of public and private keys.

```typescript
keys: {
  phrase: "action inject penalty envelope rabbit element slim tornado dinner pizza off blood",
  amount: 20,
},
```

Then the signer can be obtained as follows:

```typescript
const signer = await locklift.keystore.getSigner('0');
const signer2 = await locklift.keystore.getSigner('1');
```

## Mocha

The `mocha` field allows you to specify settings for the Mocha testing framework.

```typescript
mocha: {
  timeout: 2000000,
},
```

This example sets the timeout for Mocha tests to 2000 seconds.

## Package.json Overrides

Along with the `locklift.config.ts` configuration file, Locklift also utilizes the `package.json` file for configuring certain aspects of your project. One such aspect is the version of the Nekoton WASM SDK that your project uses.

Locklift uses an extended version of the Nekoton WASM SDK, and you can ensure that all sub-libraries use this extended version by adding an `overrides` field to your `package.json` file. Here's what the `overrides` field should look like:

```json
"overrides": {
  "nekoton-wasm": "npm:nekoton-wasm-locklift@^1.20.2"
}
```

Adding this field to your `package.json` file ensures that all sub-libraries in your project use the extended version of the Nekoton WASM SDK that is compatible with Locklift.
