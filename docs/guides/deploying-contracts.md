---
title: Deploying Contracts
outline: deep
---

# Deploying Contracts

This guide provides a detailed walkthrough on how to deploy contracts using the Locklift framework. The focus is on the `locklift.factory` module, which offers functionality for deploying contracts and retrieving contract objects from TSolidity sources or `config.extarnalContracts`.

## Contract Factory (`locklift.factory`)

The Contract Factory module in Locklift provides tools for deploying contracts and getting contract sources. You can retrieve contract objects from your project's Solidity sources or the contracts specified in `config.extarnalContracts`.

### Retrieving Contract Artifacts

You can get all compilation artifacts based on the .tsol or .sol file name or the name from `config.extarnalContracts[pathToLib]` using the `locklift.factory.getContractArtifacts` method.

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

### Deploying a Contract

The `locklift.factory.deployContract` method deploys a specified contract and returns a contract instance and the transaction.

```typescript
// Deploy
const { contract: sample, tx } = locklift.factory.deployContract({
  // name of your contract
  contract: 'Sample',
  // public key in init data
  publicKey: signer.publicKey,
  // static parameters of contract
  initParams: {
    _nonce: locklift.utils.getRandomNonce(),
  },
  // runtime deployment arguments
  constructoParams: {
    _state: INIT_STATE,
  },
  // this value will be transfered from giver to deployable contract
  value: locklift.utils.toNano(2),
});
```

:::tip
For a detailed tutorial on contract deployment, particularly using the inpage provider, visit this [step-by-step guide](https://docs.broxus.com/guides/4-deploy.html#deploy-a-contract). This will help deepen your understanding of the intricacies of deploying contracts using the Locklift.
:::

#### Getting Deployed Contract

The `locklift.factory.getDeployedContract` method returns a contract instance by its name and address.

```typescript
const sample = locklift.factory.getDeployedContract(
  'Sample', //name inferred from your contracts
  new Address('MyAddress')
);
```

## Contract Class

The Contract Wrapper Class integrates all methods derived from the built sources, namely the ABI (Application Binary Interface).

```typescript
const sample = locklift.factory.getDeployedContract(
  'Sample', //name inferred from your contracts
  new Address('MyAddress')
);
// Send External
await sample.methods
  .setState({ _state: 10 })
  .sendExternal({ publicKey: signer.publicKey });
// Run getter or view method
const response = await sample.methods.getDetails({}).call();
```

:::tip
This class is part of the Everscale Inpage Provider functionality. For a comprehensive overview of its features and potential, you can check out the [API reference here](https://docs.broxus.com/api-reference/contract.html). Additionally, to understand better how to interact with contracts, consult the dedicated guide available [here](https://docs.broxus.com/guides/3.2-working-with-contracts.html#contract-wrapper).
:::

## Wallets and Accounts (`locklift.factory.accounts`)

Locklift offers an extensive framework for managing wallets and accounts, which are crucial in TVM blockchains. This document covers the deployment of new wallets or accounts, retrieval of existing ones, and their interaction using Locklift.

### Wallet Types

In the Locklift, several wallet types are provided for developers' convenience. These are defined in the `WalletTypes` enumeration and include:

- `WalletV3`: A wallet of version 3, represented by the `WalletV3Account` class. It includes methods for fetching the public key and preparing a message.

- `HighLoadWalletV2`: A high-load wallet of version 2, represented by the `HighloadWalletV2` class. It includes methods for fetching the public key and preparing a message.

- `MsigAccount`: A multisig account that supports the Giver ABI (GiverV2, SafeMultisig, SetcodeMultisig, Surf), represented by the `MsigAccount` class, which extends the `GenericAccount` class.

- `EverWallet`: An EverWallet account, represented by the `EverWalletAccount` class. It includes methods for fetching the public key, preparing a message, and handling optional nonce for initial data.

Each wallet type comes with its specific features and use cases. For example, the `MsigAccount` supports the Giver ABI, which includes a `sendTransaction` function. This function allows the wallet to send transactions to other accounts or contracts. The function parameters include the destination address, the value to be transferred, a bounce flag, a flags parameter, and a payload that contains the message to be sent.

### Creating and Using Wallets

Locklift provides a convenient interface for creating and managing wallets and accounts. To create a new account, you can use the `locklift.factory.accounts.addNewAccount` method.

#### WalletV3, HighLoadWallet, or EverWallet

```typescript
const account = await locklift.factory.accounts.addNewAccount({
  type: WalletTypes.EverWallet, // or WalletTypes.HighLoadWallet or WalletTypes.WalletV3,
  // The value which will be sent to the new account from a giver
  value: toNano(100000),
  // Owner's publicKey
  publicKey: signer.publicKey,
});
```

#### Multisig Wallets (e.g., SafeMultisig)

```typescript
const account = await locklift.factory.accounts.addNewAccount({
  type: WalletTypes.MsigAccount,
  // Multisig type SafeMultisig supports 2.0 ABI version, multisig2 supports 2.3 ABI version
  mSigType: 'SafeMultisig', // or SafeMultisig
  // Contract should be included in the locklift.config.externalContracts or should be compiled from the contracts folder
  contract: 'Account',
  // Value which will be sent to the new account from a giver
  value: toNano(100000),
  publicKey: signer.publicKey,
  constructorParams: {},
  initParams: {
    _randomNonce: getRandomNonce(),
  },
});
```

Afterwards, you can use `account.address` as the sender.

```typescript
const account = await locklift.factory.accounts.addNewAccount({
  type: WalletTypes.EverWallet, // or WalletTypes.HighLoadWallet or WalletTypes.WalletV3,
  // Value which will be sent to the new account from a giver
  value: toNano(100000),
  // Owner's publicKey
  publicKey: signer.publicKey,
  nonce: getRandomNonce(),
});

await myContract.methods.mint({}).send({
  // Sender's account
  from: account.address,
  amount: toNano(20),
});
```

#### Custom Wallets

:::info
When you're working with custom wallets, you need to follow the same rules as for simple deploy, meaning you need to pass the constructor and init params. Please note that this is a low-level method of adding accounts.
:::
Here's an example:

```typescript
import { GenericAccount } from 'locklift/everscale-standalone-client';

const { abi: myMsigAccountAbi } =
  locklift.factory.getContractArtifacts('MyMsigAccount');

class MyMsigAccount extends GenericAccount {
  constructor(args: {
    address: string | Address;
    publicKey?: string;
  }) {
    super({ abi: myMsigAccountAbi, ...args });
  }
}

const signer = await locklift.keystore.getSigner('0');
const { contract: myMsigContract } =
  await locklift.factory.deployContract({
    contract: 'MyMsigAccount',
    constructorParams: {},
    initParams: {
      _randomNonce: getRandomNonce(),
    },
    value: toNano(10),
    publicKey: signer.publicKey,
  });
const myMsigAccount = new MyMsigAccount({
  address: myMsigContract.address,
  publicKey: signer.publicKey,
});
locklift.factory.accounts.storage.addAccount(myMsigAccount);

await myContract.methods.mint({}).send({
  //sender account
  from: myMsigAccount.address,
  amount: toNano(20),
});
```

#### Using an Existing Account

Locklift also provides the option to use existing accounts. To do this, you can use the `locklift.factory.accounts.addExistingAccount` method:

```typescript
const everWalletAccount =
  await locklift.factory.accounts.addExistingAccount({
    address: 'MyAddress',
    type: WalletTypes.EverWallet,
  });

const walletV3Account =
  await locklift.factory.accounts.addExistingAccount({
    publicKey: signer.publicKey,
    type: WalletTypes.WalletV3,
  });

const mySafeMultisigAccount =
  await locklift.factory.accounts.addExistingAccount({
    publicKey: signer.publicKey,
    type: WalletTypes.Custom,
    address: 'MyAddress',
  });

await myContract.methods.mint({}).send({
  // Sender account
  from: mySafeMultisigAccount.address, // or walletV3Account.address
  amount: toNano(20),
});
```

## Deprecated AccountFactory (`locklift.factory.getAccountsFactory`)

As of version 2.2.0, the use of `locklift.factory.getAccountsFactory` is deprecated. It's recommended to use `locklift.factory.accounts` instead.

This module previously provided a generic account factory. You could provide your own implementation of the account if needed, with one constraint - the custom contract should include a specific method.

```typescript
accountAbiBase = {
  functions: [
    {
      name: 'sendTransaction',
      inputs: [
        { name: 'dest', type: 'address' },
        { name: 'value', type: 'uint128' },
        { name: 'bounce', type: 'bool' },
        { name: 'flags', type: 'uint8' },
        { name: 'payload', type: 'cell' },
      ],
      outputs: [],
    },
  ],
};
```

```typescript
let accountsFactory = locklift.factory.getAccountsFactory(
  'Wallet' // name of contract used as a wallet
);
```

Now you can use it for deploying contract or getting deployed ones.

### Deploy

```typescript
const {contract: MyAccount, tx} = accountsFactory.deployNewAccount({
  publicKey: signer.publicKey,
  initParams: {
    _randomNonce: getRandomNonce(),
  },
  constructorParams: {...},
  value: locklift.utils.toNano(100000)
});
```

### Get Account by Address

```typescript
const Account = accountsFactory.getAccount(
  new Address('MyAddress'),
  signer.publicKey
);
```

## Giver (`locklift.giver`)

The Giver module in Locklift is akin to a specialized smart contract designed with the specific role of distributing tokens. In the context of the local node (sandbox), a preset Giver exists, already equipped with native tokens for your convenience.

Here's how you can define the Giver for different networks within your Locklift configuration:

```typescript
networks: {
  local: {
    // The default Giver for a local node is giverV2
    giver: {
      address: "0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415",
      key: "172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3",
      // To use a custom giver, uncomment and modify the following line
      // giverFactory: (ever, keyPair, address) => new SimpleGiver(ever, keyPair, address),
    },
  },
  mainnet: {
    // On the mainnet, the default SafeMultisig wallet serves as the Giver
    giver: {
      address: "0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415",
      // Instead of a key, a bip39 phrase can be used
      phrase: "action inject penalty envelope rabbit element slim tornado dinner pizza off blood",
      accountId: 0,
    },
  },
},
```

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
