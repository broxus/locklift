# Locklift

Locklift is a development environment aiming to help you with FreeTON contracts
development. With Locklift, you get:

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

By default, the configuration file is called `locklift.config.js`. Here's the
basic layout:

```javascript
module.exports = {
  compiler: {
    // Specify path to your TON-Solidity-Compiler
    path: "/usr/bin/solc-ton",
  },
  linker: {
    // Path to your TVM Linker
    path: "/usr/bin/tvm_linker",
  },
  networks: {
    // You can use TON labs graphql endpoints or local node
    local: {
      ton_client: {
        // See the TON client specification for all available options
        network: {
          server_address: "http://localhost/",
        },
      },
      // This giver is default local-node giver
      giver: {
        address:
          "0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94",
        abi: {
          "ABI version": 1,
          functions: [
            { name: "constructor", inputs: [], outputs: [] },
            {
              name: "sendGrams",
              inputs: [
                { name: "dest", type: "address" },
                { name: "amount", type: "uint64" },
              ],
              outputs: [],
            },
          ],
          events: [],
          data: [],
        },
        key: "",
      },
      // Use tonos-cli to generate your phrase
      // !!! Never commit it in your repos !!!
      keys: {
        phrase: "",
        amount: 20,
      },
    },
  },
};
```

### Set up mnemonic phrase

If you leave `phrase` field value empty - new random seed will be generated each
time you're running locklift. If you specify it explicitly - fill the `phrase`
field with mnemonic. Use the following command to create new phrase:

```
$ locklift genphrase
```

## Build contracts

This command uses the specified TON Solidity compiler and TVM linker to build
all project contracts.

```
$ locklift build
Found 1 sources
Building contracts/Sample.sol
Compiled contracts/Sample.sol
Linked contracts/Sample.sol
```

## Run sandbox

This command starts a local node in Docker. Make sure you have Docker installed.

```
$ locklift runSandbox
Sandbox launched successfully!
```

## Kill sandbox

This command kills the sandbox container

```
$ locklift killSandbox
The sandbox has been stopped!
```

## Deploy account

This command deploys account. In the testnet, the account is deployed from the
starting 100 EVERs on the account.

```
$ locklift deployAccount
Wallet1: 0:7a0914bdf25d92bdcdc91e41173050ff1a2a022a74a0b2118247e1e6d56de22b
```

## Get balance

This command used to get account balance.

```
$ locklift getBalance -a  0:7a0914bdf25d92bdcdc91e41173050ff1a2a022a74a0b2118247e1e6d56de22b --convert

99.991592999
```

## Transfer

This command is used to send evers to another account.

```
$ locklift transfer --to 0:dd014d1551a4587fe76c2c201873816b72847e1efd446b687b4118a9702d0946 -a 5000000
{
  transaction: {
    json_version: 8,
    id: '9f5fa319ecb3ce5c8dbe0fa347cff41cf79e5d89e173e7478d9a228edfb13d0c',
    boc: 'te6ccgECCgEAAkcAA7V90BTRVRpFh/52wsIBhzgWtyhH4e/URraHtBGKlwLQlGAAAAAAAAAElfMoNL8rdFc5bhfgjbDuu0k9dZnXn0UFYLQajziVmKawAAAAAAAAA/YsS6iQADRumXmIBQQBAg8MRQYaxw9EQAMCAG/Jh6EgTBRYQAAAAAAAAgAAAAAAA76Dh3ldkTn2/bx3+HGqrZVTecSELSyBSk5ZeTRoVlBgQFAVzACdQtgjE4gAAAAAAAAAAB6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIACCcoVFoAt2HwWN0ODfi70KG2rH6oO2fhu649hpHbUjZV7UZHseoMteEQ/mPL/cY/b/QStwru5pmg4dN1EwYjhOw9ACAeAIBgEB3wcAr2gBugKaKqNIsP/O2FhAMOcC1uUI/D36iNbQ9oIxUuBaEo0AN0BTRVRpFh/52wsIBhzgWtyhH4e/URraHtBGKlwLQlGM9CQABhRYYAAAAAAAAACUxYl1EkAB5YgBugKaKqNIsP/O2FhAMOcC1uUI/D36iNbQ9oIxUuBaEowHwbMU9Wq7iIpqZhNe2tgobd10/mMKkeL6UgDa8aIf0kstCPsaPgvzljS/OftlPg+HchqZ9u420ZYzG08LUnGwHAAABgdB4pUZixLqwMV75NYJAGOAG6Apoqo0iw/87YWEAw5wLW5Qj8PfqI1tD2gjFS4FoSjAAAAAAAAAAAAAAAAACYloGA==',
    status: 3,
    status_name: 'finalized',
    storage: {
      storage_fees_collected: '0x14',
      status_change: 0,
      status_change_name: 'unchanged'
    },
    compute: {
      success: true,
      msg_state_used: false,
      account_activated: false,
      gas_fees: '0x58e1e8',
      gas_used: 5825,
      gas_limit: 0,
      gas_credit: 10000,
      mode: 0,
      exit_code: 0,
      vm_steps: 122,
      vm_init_state_hash: '0000000000000000000000000000000000000000000000000000000000000000',
      vm_final_state_hash: '0000000000000000000000000000000000000000000000000000000000000000',
      compute_type: 1,
      compute_type_name: 'vm'
    },
    action: {
      success: true,
      valid: true,
      no_funds: false,
      status_change: 0,
      total_fwd_fees: '0xf4240',
      total_action_fees: '0x51610',
      result_code: 0,
      tot_actions: 1,
      spec_actions: 0,
      skipped_actions: 0,
      msgs_created: 1,
      action_list_hash: 'df41c3bcaec89cfb7ede3bfc38d556caa9bce242169640a5272cbc9a342b2830',
      tot_msg_size_cells: 1,
      tot_msg_size_bits: 697
    },
    credit_first: true,
    aborted: false,
    destroyed: false,
    tr_type: 0,
    tr_type_name: 'ordinary',
    lt: '0x49',
    prev_trans_hash: '5f32834bf2b7457396e17e08db0eebb493d7599d79f450560b41a8f389598a6b',
    prev_trans_lt: '0x3f',
    now: 1657059977,
    outmsg_cnt: 1,
    orig_status: 1,
    orig_status_name: 'Active',
    end_status: 1,
    end_status_name: 'Active',
    in_msg: '1945ddee32c0e505e2b6956fc594daf6e61d96767419dfe24a14219d7017eb5a',
    ext_in_msg_fee: '0x16d3c0',
    out_msgs: [
      'b39df6c8cf45640762234da45c65aadbf08d8de71cffafb06d9498ec9e111c00'
    ],
    account_addr: '0:dd014d1551a4587fe76c2c201873816b72847e1efd446b687b4118a9702d0946',
    workchain_id: 0,
    total_fees: '0x74cbcc',
    balance_delta: '-0xbc00fc',
    old_hash: '8545a00b761f058dd0e0df8bbd0a1b6ac7ea83b67e1bbae3d8691db523655ed4',
    new_hash: '647b1ea0cb5e110fe63cbfdc63f6ff412b70aeee699a0e1d37513062384ec3d0'
  },
  out_messages: [
    'te6ccgEBAQEAWgAAr2gBugKaKqNIsP/O2FhAMOcC1uUI/D36iNbQ9oIxUuBaEo0AN0BTRVRpFh/52wsIBhzgWtyhH4e/URraHtBGKlwLQlGM9CQABhRYYAAAAAAAAACUxYl1EkA='
  ],
  decoded: { out_messages: [ null ], output: null },
  fees: {
    in_msg_fwd_fee: 1496000,
    storage_fee: 20,
    gas_fee: 5825000,
    out_msgs_fwd_fee: 1000000,
    total_account_fees: 8321020,
    total_output: 4000000
  }
}
```

## Show code

This command is used to display the contract code.

```
$ locklift showCode -cn Wallet
Wallet code:
te6ccgECDgEAAXoABCSK7VMg4wMgwP/jAiDA/uMC8gsLAgENApztRNDXScMB+GYh2zzTAAGOEoECANcYIPkBWPhCIPhl+RDyqN7TPwH4QyG58rQg+COBA+iogggbd0CgufK0+GPTHwH4I7zyudMfAds88jwFAwNK7UTQ10nDAfhmItDXCwOpOADcIccA4wIh1w0f8rwh4wMB2zzyPAoKAwIoIIIQMV75NbrjAiCCEGi1Xz+64wIHBAJIMPhCbuMA+Ebyc9H4QvLgZfhFIG6SMHDe+EK68uBm+ADbPPIABQgBPu1E0NdJwgGOFHDtRND0BYBA9A7yvdcL//hicPhj4w0GAB7tRNDT/9M/0wAx0fhj+GICMjD4RvLgTCGT1NHQ3vpA03/SANHbPOMA8gAJCAAc+EP4QsjL/8s/z4PJ7VQATPhFIG6SMHDe+EK68uBk+AASyM+FgMoAz4RAzgH6AoBrz0DJcPsAAAr4RvLgTAIK9KQg9KENDAAUc29sIDAuNTkuMAAA
```

## Test contracts

This command runs the project Mocha tests, `test` folder by default. The
`locklift` object will be set up and included automatically, you don't need to
import it manually.

```
$ locklift test

  Test Sample contract
    Contracts
      ✓ Load contract factory
      ✓ Deploy contract (1491ms)
      ✓ Interact with contract (1110ms)


  3 passing (3s)
```

## Run script

This command runs an arbitrary Node JS script with already configured `locklift`
module.

```
$ locklift run --script scripts/1-deploy-sample.js
Sample deployed at: 0:a56a1882231c9d901a1576ec2187575b01d1e33dd71108525b205784a41ae6d0
```

## Locklift docs

This section describes the features of the `locklift` module.

### TON (`locklift.ton`)

This module provides the set of objects and functions, for low level interacting
with TON.

#### `locklift.ton.client`

The Locklift is built around TON Labs
[ton-client-js](https://github.com/tonlabs/ton-client-js) module. By using
`locklift.ton.client` you can access the already configured `TonClient` oject.
The configuration should be stored in your config file at
`networks[network].ton_client`.

#### `locklift.ton.getBalance`

Wrapper around GraphQL account balance query. Throws an error if account not
found.

##### Example

```javascript
const userBalance = await locklift.ton.getBalance(user.address);

expect(userBalance.toNumber()).to.be.above(0, "Bad user balance");
```

#### `locklift.ton.getAccountType`

Wrapper around GraphQL account type query. Throws an error if account not found.

##### Example

```javascript
const { acc_type_name } = await locklift.ton.getAccountType(user.address);

expect(acc_type_name).to.be.equal("Active", "User account not active");
```

### Factory (`locklift.factory`)

This module provides the factory for creating the contract objects from the
project Solidity sources.

#### `locklift.factory.getContract`

This contract returns the [Contract](#contract) instance, based on the .sol file
name.

##### Example

```javascript
const Sample = await locklift.factory.getContract("Sample");
```

#### `locklift.factory.getAccount`

This method returns the special [Account](#account) contract.

### Contract

Basic object which wraps the TON smart contract. Allows to sends the run
messages into the network, or run messages locally, to derive some data from the
smart contract.

### Account

This class extends the basic `Contract` functionality by adding special
`runTarget` method, which allows to interact with TON contracts, by sending
internal message from "Account" contract. It encodes the specified method +
params into the internal message, according to the target contract's ABI and
call the Account's external method.

The basic Account contract is placed into the
[Account.sol](contracts/contracts/Account.sol).

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

This module allows you to deploy your contracts by using the Giver
functionality. Default configuration consists, all the details for local giver.
Locklift expects to see the following Giver external method:

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

This module provides basic keystore functionality. The keys will be derived from
your configuration `networks[network].keys`. You can also specify custom
derivation path:

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

This module provides some utility functionality for more convenient work with
TON objects.

#### `locklift.utils.convertCrystal(amount, dimension)`

Converts amount of TONs / nanoTONs into nanoTONs / TONs. Returns `BigNumber`
object.

##### Example

````javascript
locklift.utils.convertCrystal(10, "nano"); // 10000000000
locklift.utils.convertCrystal(10000000000, "ton"); // 10```
````

#### `locklift.utils.getBalance(contract, convertCrystal)`

Get contract balance.

##### Example

````javascript
const contract = "0:dd4df10e1f64c03a075a77cab48c59cac6261710d2c0af9ca303fcd190b3652c"
locklift.utils.getBalance(contract); // 10000000000
locklift.utils.getBalance(contract, true); // 10
````

#### `locklift.utils.transfer(to, amount, keyPair)`

Transfer EVER to another account. Returns txId.

##### Example

````javascript
const to = "0:dd4df10e1f64c03a075a77cab48c59cac6261710d2c0af9ca303fcd190b3652c"
locklift.utils.transfer(to, 10000000, 0);
````

#### `locklift.utils.deployAccount(keyNumber, balance)`

Shortcut to deploy the contract by using locklift.giver.deployContract. Returns Wallet Object.

##### Example

````javascript
locklift.utils.deployAccount(0, 1000000000);
````

#### `locklift.utils.showCode(contractName)`

Returns the contract code.

##### Example

````javascript
locklift.utils.showCode("Wallet");
````

#### `locklift.utils.validateAddress(address)`

Validate everscale address. Returns bool.

##### Example

````javascript
locklift.utils.validateAddress("0:dd014d1551a4587fe76c2c201873816b72847e1efd446b687b4118a9702d0946"); // true

locklift.utils.validateAddress("0:dd014d1551a4587fe76c2c201873816b72847e1efd446b687b4118a9702d094642"); // false
````

