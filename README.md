# Locklift 

Locklift is a development environment aiming to help you with FreeTON contracts development. With Locklift, you get:

- Network management for working with any networks (main, test, local, ...)
- Automated contract testing with Mocha
- Handy wrapper around FreeTON smart contract
- Custom givers support
- Keys management
- External script runner that executes scripts within specified environment

## Install

```
npm install -g locklift
```

## Get version

```
locklift --version
```

## CLI docs

This section describes the set of commands, supported by the `locklift` package.

### Initialize Locklift package

```
$ locklift init --path amazing-locklift-project
New Locklift project initialized in amazing-locklift-project
```

This command initialize new Locklift project, filled with samples:

```
├── contracts
│   └── Sample.sol
├── locklift.config.js
├── scripts
│   └── 1-deploy-sample.js
└── test
    └── sample-test.js
```

## Configuration

By default, the configuration file is called `locklift.config.js`. Here's the basic layout:

```javascript
module.exports = {
  compiler: {
    // Specify path to your TON-Solidity-Compiler
    path: '/usr/bin/solc-ton',
  },
  linker: {
    // Path to your TVM Linker
    path: '/usr/bin/tvm_linker',
  },
  networks: {
    // You can use TON labs graphql endpoints or local node
    local: {
      ton_client: {
        // See the TON client specification for all available options
        network: {
          server_address: 'http://localhost/',
        },
      },
      // This giver is default local-node giver
      giver: {
        address: '0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94',
        abi: { "ABI version": 1, "functions": [ { "name": "constructor", "inputs": [], "outputs": [] }, { "name": "sendGrams", "inputs": [ {"name":"dest","type":"address"}, {"name":"amount","type":"uint64"} ], "outputs": [] } ], "events": [], "data": [] },
        key: '',
      },
      // Use tonos-cli to generate your phrase
      // !!! Never commit it in your repos !!!
      keys: {
        phrase: '',
        amount: 20,
      }
    },
  },
};
```

### Set up mnemonic phrase

If you leave `phrase` field value empty - new random seed will be generated each time you're running locklift. If you specify it explicitly - fill the `phrase` field with mnemonic. Install [tonos-cli](https://github.com/tonlabs/tonos-cli) and use the following command to create new phrase:

```
$ tonos-cli genphrase
```

## Build contracts

This command uses the specified TON Solidity compiler and TVM linker to build all project contracts.

```
$ locklift build --config locklift.config.js
Found 1 sources
Building contracts/Sample.sol
Compiled contracts/Sample.sol
Linked contracts/Sample.sol
```

## Test contracts

This command runs the project Mocha tests, `test` folder by default. The `locklift` object will be
set up and included automatically, you don't need to import it manually.

```
$ locklift test --config locklift.config.js --network local


  Test Sample contract
    Contracts
      ✓ Load contract factory
      ✓ Deploy contract (1491ms)
      ✓ Interact with contract (1110ms)


  3 passing (3s)
```

## Run script

This command runs an arbitrary Node JS script with already configured `locklift` module.

```
$ locklift run --config locklift.config.js --network local --script scripts/1-deploy-sample.js 
Sample deployed at: 0:a56a1882231c9d901a1576ec2187575b01d1e33dd71108525b205784a41ae6d0
```

## Locklift docs

This section describes the features of the `locklift` module.

### TON (`locklift.ton`)

This module provides the set of objects and functions, for low level interacting with TON.

#### `locklift.ton.client`

The Locklift is built around TON Labs [ton-client-js](https://github.com/tonlabs/ton-client-js) module.
By using `locklift.ton.client` you can access the already configured `TonClient` oject.
The configuration should be stored in your config file at `networks[network].ton_client`.

#### `locklift.ton.getBalance`

Wrapper around GraphQL account balance query. Throws an error if account not found.

##### Example
```javascript
const userBalance = await locklift.ton.getBalance(user.address);

expect(userBalance.toNumber()).to.be.above(0, 'Bad user balance');
```

#### `locklift.ton.getAccountType`

Wrapper around GraphQL account type query. Throws an error if account not found.

##### Example
```javascript
const {
  acc_type_name
} = await locklift.ton.getAccountType(user.address);

expect(acc_type_name).to.be.equal('Active', 'User account not active');
```

### Factory (`locklift.factory`)

This module provides the factory for creating the contract objects from the project Solidity sources.

#### `locklift.factory.getContract`

This contract returns the [Contract](#contract) instance, based on the .sol file name.

##### Example

```javascript
const Sample = await locklift.factory.getContract('Sample');
```

#### `locklift.factory.getAccount`

This method returns the special [Account](#account) contract.

### Contract

Basic object which wraps the TON smart contract. Allows to sends the run messages into the network,
or run messages locally, to derive some data from the smart contract.

### Account

This class extends the basic `Contract` functionality by adding special `runTarget` method,
which allows to interact with TON contracts, by sending internal message from "Account" contract.
It encodes the specified method + params into the internal message, according to the
target contract's ABI and call the Account's external method.

The basic Account contract is placed into the [Account.sol](contracts/contracts/Account.sol).

```
const Account = await locklift.factory.getAccount();
const [,userKeys] = await locklift.keys.getKeyPairs();

const user = await locklift.giver.deployContract({
  contract: Account,
  constructorParams: {},
  initParams: {
    _randomNonce: getRandomNonce(),
  },
  keyPair: userKeys,
});

user.setKeyPair(userKeys);

await user.runTarget({
  contract: root,
  method: 'deployEmptyWallet',
  params: {
    deploy_grams: convertCrystal(1, 'nano'),
    wallet_public_key_: 0,
    owner_address_: user.address,
    gas_back_address: user.address,
  },
  value: convertCrystal(2, 'nano'),
});
```

### Giver (`locklift.giver`)

This module allows you to deploy your contracts by using the Giver functionality.
Default configuration consists, all the details for local giver. Locklift expects to see the following
Giver external method:

```
{
   "name":"sendGrams",
   "inputs":[
      {
         "name":"dest",
         "type":"address"
      },
      {
         "name":"amount",
         "type":"uint64"
      }
   ]
}
```

#### `locklift.giver.deployContract`

Deploys the contract by using giver contract.

1. Derives the future contract address
2. Sends the specified amount of TONs to it's address
3. Waits till the balance is sufficient
4. Sends the contract deploy message

##### Example

```
const Account = await locklift.factory.getAccount();
const [,userKeys] = await locklift.keys.getKeyPairs();

user = await locklift.giver.deployContract({
  contract: Account,
  constructorParams: {},
  initParams: {
    _randomNonce: getRandomNonce(),
  },
  keyPair: userKeys,
});
```

### Keys (`locklift.keys`)

This module provides basic keystore functionality. The keys will be derived
from your configuration `networks[network].keys`. You can also specify custom derivation path:

```
      keys: {
        phrase: '...',
        path: 'm/44\'/396\'/0\'/0/INDEX',
        amount: 20,
      }
```

#### `locklift.keys.getKeyPairs()`

Returns the list of key pairs.

##### Example

```
const [keyPair] = await locklift.keys.getKeyPairs();
// { secret: '...', public: '...' }
```

### Utils

This module provides some utility functionality for more convenient work with TON objects.

#### `locklift.utils.convertCrystal(amount, dimension)`

Converts amount of TONs / nanoTONs into nanoTONs / TONs. Returns `BigNumber` object.

##### Example

```javascript
locklift.utils.convertCrystal(10, 'nano'); // 10000000000
locklift.utils.convertCrystal(10000000000, 'ton'); // 10```
