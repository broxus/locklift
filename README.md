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

## Initialize Locklift package

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
        phrase: process.env.PHRASE,
        amount: 20,
      }
    },
  },
};
```

### Build contracts

```
$ PHRASE="rely ... sponsor" locklift build --config locklift.config.js
Found 1 sources
Building contracts/Sample.sol
Compiled contracts/Sample.sol
Linked contracts/Sample.sol
```

### Test contracts

```
$ PHRASE="rely ... sponsor" locklift test --config locklift.config.js --network local


  Test Sample contract
    Contracts
      ✓ Load contract factory
      ✓ Deploy contract (1491ms)
      ✓ Interact with contract (1110ms)


  3 passing (3s)
```

### Run script

```
$ PHRASE="rely ... sponsor" locklift run --config locklift.config.js --network local --script scripts/1-deploy-sample.js 
Sample deployed at: 0:a56a1882231c9d901a1576ec2187575b01d1e33dd71108525b205784a41ae6d0
```
