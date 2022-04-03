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

## Tracing
The tracing module scans the message tree, determines which contracts have been deployed,
and decodes all method calls. In case of an error in some section of the execution graph,
tracing will show the chain of calls that led to the error, as well as the error itself.

Tracing could be enabled on testing or running scripts with flag:
```bash
locklift test --config locklift.config.js -n local --enable-tracing

...

	#1 action out of 1
Addr: 0:785ea492db0bc46e370d9ef3a0cc23fb86f7a734ac7948bb50e25b51b2455de0
MsgId: 963a963f227d69f2845265335ecee99052411204b767be441755796cc28482f4
-----------------------------------------------------------------
TokenWallet.transfer{value: 4.998, bounce: true}(
    amount: 100
    recipient: 0:5d0075f4d3b14edb87f78c5928fbaff7aa769a49eedc7368c33c95a6d63bbf17
    deployWalletValue: 0
    remainingGasTo: 0:bb0e7143ca4c16a717733ff4a943767efcb4796dd1d808e027f39e7712745efc
    notify: true
    payload: te6ccgEBAQEAKAAAS4AXvOIJRF0kuLdJrf7QNzLzvROSLywJoUpcj6w7WfXqVCAAAAAQ
)
		⬇
		⬇
	#1 action out of 1
Addr: 0:b00ef94c1a23a48e14cdd12a689a3f942e8b616d061d74a017385f6edc704588
MsgId: bcbe2fb9efd98efe02a6cb6452f38f3dce364b5480b7352000a32f7bdfde949a
-----------------------------------------------------------------
TokenWallet.acceptTransfer{value: 4.978, bounce: true}(
    amount: 100
    sender: 0:bb0e7143ca4c16a717733ff4a943767efcb4796dd1d808e027f39e7712745efc
    remainingGasTo: 0:bb0e7143ca4c16a717733ff4a943767efcb4796dd1d808e027f39e7712745efc
    notify: true
    payload: te6ccgEBAQEAKAAAS4AXvOIJRF0kuLdJrf7QNzLzvROSLywJoUpcj6w7WfXqVCAAAAAQ
)
		⬇
		⬇
	#1 action out of 1
Addr: 0:5d0075f4d3b14edb87f78c5928fbaff7aa769a49eedc7368c33c95a6d63bbf17
MsgId: 99034783340906fb5b9eb9a379e1fcb08887992ed0183da78e363ef694ba7c52
-----------------------------------------------------------------
EverFarmPool.onAcceptTokensTransfer{value: 4.952, bounce: false}(
    tokenRoot: 0:c87f8def8ff9ab121eeeb533dc813908ec69e420101bda70d64e33e359f13e75
    amount: 100
    sender: 0:bb0e7143ca4c16a717733ff4a943767efcb4796dd1d808e027f39e7712745efc
    senderWallet: 0:785ea492db0bc46e370d9ef3a0cc23fb86f7a734ac7948bb50e25b51b2455de0
    remainingGasTo: 0:bb0e7143ca4c16a717733ff4a943767efcb4796dd1d808e027f39e7712745efc
    payload: te6ccgEBAQEAKAAAS4AXvOIJRF0kuLdJrf7QNzLzvROSLywJoUpcj6w7WfXqVCAAAAAQ
)
 !!! Reverted with 1233 error code on compute phase !!!
```
If you use contracts built outside of the locklift context you should provide all external build
directories so that tracing module work correctly:
```
locklift test --config locklift.config.js -n local --enable-tracing --external-build node_modules/broxus-ton-tokens-contracts/build
```
### Ignoring errors
By default tracing will throw error on any non-zero code in execution graph, but
sometimes in contract we can expect some specific errors that could be processed later with bounced msgs.
In this cases we dont want tracing to throw errors, because such behaviour is expected.
We can tell tracing to ignore specific errors on compute or action phases.

We can ignore errors on specific call:
```
// tracing will ignore all 51 and 60 errors on compute phase + 30 error on action phase
// note that these errors will be ignored for all msgs created by this call, not just for 1 one
await user.runTarget({
  contract: root,
  method: 'deployEmptyWallet',
  params: {},
  tracing_allowed_codes: {compute: [51, 60], action: [30]}
});
```
Or set ignoring by default for all further calls:
```
// ignore only compute phase erros
locklift.tracing.allowCodes({compute: [51, 60]})

// remove code from default list of ignored errors, so that only 51 erros will be ignored
locklift.tracing.removeAllowedCodes({compute: [60]})
```
If we enabled tracing with flag, but we want to disable tracing for specific call we can force-disable it:
```
await user.runTarget({
  contract: root,
  method: 'deployEmptyWallet',
  params: {},
  tracing: false
});
```
At the same time we can force-enable tracing for specific call if tracing flag was not set:
```
await user.runTarget({
  contract: root,
  method: 'deployEmptyWallet',
  params: {},
  tracing: true
});
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
