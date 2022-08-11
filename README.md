![locklift logo](https://user-images.githubusercontent.com/15921290/183642554-6372baf5-bac5-4477-888b-870a6993f666.png)

<p align="center">
    <p align="center">Development environment for Everscale blockchain.</p>
    <p align="center">
        <a href="/LICENSE">
            <img alt="GitHub" src="https://img.shields.io/badge/license-Apache--2.0-orange" />
        </a>
        <a href="https://www.npmjs.com/package/locklift">
            <img alt="npm" src="https://img.shields.io/npm/v/locklift">
        </a>
    </p>
</p>

Locklift is a development environment aiming to help you with Everscale contracts development. With Locklift, you get:

- Network management for working with any networks (main, test, local, ...)
- Automated contract testing with Mocha
- Handy wrapper around Everscale smart contract
- Custom givers support
- Keys management
- External script runner that executes scripts within specified environment

## Quick start

To install Locklift you need node 14 or later. Go to an empty folder, initialize an npm project (i.e. npm init), and run

```bash
npm install --save-dev locklift
```

Once it's installed you can initialize project

```bash
// initialize in current directory
npx locklift init -f
// or specify new one
npx locklift init --path amazing-locklift-project
```

## Get version

```bash
npx locklift --version
```

## CLI docs

This section describes the set of commands, supported by the `locklift` package.

### Initialize Locklift package

```bash
npx locklift init --path amazing-locklift-project
# New Locklift project initialized in amazing-locklift-project
```

This command initialize new Locklift project, filled with samples:

```
├── contracts
│   └── Sample.sol
├── locklift.config.ts
├── scripts
│   └── 1-deploy-sample.ts
├── giverSettings
|   └── index.ts
└── test
    └── sample-test.ts
```

### Other flags

`-f, --force` - force run the init command (in case you have any files in target directory);

## Configuration

By default, the configuration file is called `locklift.config.ts`. Here's the basic layout:

```typescript
const LOCAL_NETWORK_ENDPOINT = "http://localhost/graphql";

const config: LockliftConfig = {
  compiler: {
    // Specify path to your TON-Solidity-Compiler
    // path: "/mnt/o/projects/broxus/TON-Solidity-Compiler/build/solc/solc",

    // Or specify version of compiler
    version: "0.61.2",

    // Specify config for extarnal contracts as in exapmple
    // This filed for generating types only
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
    version: "0.15.48",
  },
  networks: {
    local: {
      // Specify connection settings for https://github.com/broxus/everscale-standalone-client/
      connection: {
        group: "localnet",
        type: "graphql",
        data: {
          endpoints: [LOCAL_NETWORK_ENDPOINT],
          local: true,
        },
      },
      // This giver is default local-node giverV2
      giver: {
        // Check if you need provide custom giver
        giverFactory: (ever, keyPair, address) => new SimpleGiver(ever, keyPair, address),
        address: "0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415",
        key: "172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3",
      },
      tracing: {
        endpoint: LOCAL_NETWORK_ENDPOINT,
      },
      keys: {
        // Use everdev to generate your phrase
        // !!! Never commit it in your repos !!!
        // phrase: "action inject penalty envelope rabbit element slim tornado dinner pizza off blood",
        amount: 20,
      },
    },
    mainnet: {
      // Specify connection settings for https://github.com/broxus/everscale-standalone-client/
      connection: "mainnet",
      // Here, default SafeMultisig wallet is used as a giver
      giver: {
        giverFactory: (ever, keyPair, address) => new GiverWallet(ever, keyPair, address),
        address: "0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415",
        // you can use bip39 phrase instead of key
        phrase: "action inject penalty envelope rabbit element slim tornado dinner pizza off blood",
        accountId: 0,
      },
      keys: {
        // Use everdev to generate your phrase
        // !!! Never commit it in your repos !!!
        // phrase: "action inject penalty envelope rabbit element slim tornado dinner pizza off blood",
        amount: 20,
      },
    },
  },
  // you can use any settings that mocha framework support
  mocha: {
    timeout: 2000000,
  },
};
```

## Build contracts

This command uses the specified TON Solidity compiler and TVM linker to build all project contracts.

```bash
npx locklift build
```

```
Found 1 sources
Building contracts/Sample.sol
Compiled contracts/Sample.sol
Linked contracts/Sample.sol
```

## Test contracts

This command runs the project Mocha tests, `test` folder by default. The `locklift` object will be
set up and included automatically, you don't need to import it manually.

```bash
npx locklift test --network local
```

```
  Test Sample contract
    Contracts
      ✓ Load contract factory
      ✓ Deploy contract (1491ms)
      ✓ Interact with contract (1110ms)


  3 passing (3s)
```

### Debugging

You can print to console in contracts with special library:

```solidity
import "locklift/src/console.sol";

contract Sample {
    function testFunc(uint input) external {
        tvm.accept();

        console.log(format("You called testFunc with input = {}", input));
    }
}
```

Note: `console.log` functionality working only with tracing e.g:

```typescript
await lockLift.tracing.trace(sampleContract.testFunc({ input: 10 }).sendExternal({ pubkey: keyPair.publicKey }));
```

And then you will see this in your terminal:

```
You called testFunc with input = 10
```

Note the `console.log` is just an event, so if your message dropped on the computed phase (e.g `required` didn't pass), you will not see the log message.

### Tracing

The tracing module scans the message tree, determines which contracts have been deployed,
and decodes all method calls. In case of an error in some section of the execution graph,
tracing will show the chain of calls that led to the error, as well as the error itself.

#### **_Note: If you want to use tracing be sure to provide a tracing endpoint to the config that supports graphql_**

```typescript
// trace deploy
const {contract: deployedContractInstance, tx} = await locklift.tracing.trace(locklift.factory.deployContract(...))
// trace simple transaction
const changeStateTransaction = await locklift.tracing.trace(MyContract.methods.changeCounterState({newState: 10}).sendExternal({publicKey: signer.publicKey}))
// trace runTarget
const accountTransaction = await locklift.tracing.trace(myAccount.runTarget(...))
```

example with tracing output

```bash
npx locklift test -n local
```

```
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

### Ignoring errors

By default tracing will throw error on any non-zero code in execution graph, but
sometimes in contract we can expect some specific errors that could be processed later with bounced msgs.
In this cases we dont want tracing to throw errors, because such behaviour is expected.
We can tell tracing to ignore specific errors on compute or action phases.

We can ignore errors on specific call:

```typescript
// Tracing will ignore all 51 and 60 errors on compute phase + 30 error on action phase
// Here 51 compute and 30 action errors will be ignored for all transacions in msg chain and 60 compute error
// will be ignored only on specific address
const transaction = await locklift.tracing.trace(
  tokenRoot.methods.sendTokens({ walletOwner: "" }).sendExternal({ publicKey: signer.publicKey }),
  {
    allowedCodes: {
      //compute or action phase for all contracts
      compute: [40],
      //also you can specify allowed codes for specific contract
      contracts: {
        [someAddress.toString()]: {
          action: [52, 60],
        },
      },
    },
  },
);
```

Or set ignoring by default for all further calls:

```typescript
// ignore compute(or acton) phase erros for all transactions
locklift.tracing.setAllowedCodes({ compute: [52, 60] });
// ignore more errors for specific address
locklift.tracing.setAllowedCodesForAddress(SOME_ADDRESS, { compute: [123], action: [111] });

// remove code from default list of ignored errors, so that only 51 erros will be ignored
// this affects only global rules, per-address rules are not modified
locklift.tracing.removeAllowedCodes({ compute: [60] });
// remove code from deault list of ignored errors for specific address
locklift.tracing.removeAllowedCodesForAddress(SOME_ADDRESS, { compute: [123] });
```

## Run script

This command runs an arbitrary Node JS script with already configured `locklift` module.

```bash
npx locklift run --network local --script scripts/1-deploy-sample.ts
```

```
Sample deployed at: 0:a56a1882231c9d901a1576ec2187575b01d1e33dd71108525b205784a41ae6d0
```

## Locklift docs

This section describes the features of the `locklift` module.

#### `locklift.keystore`

Module provides access to keystore

##### Example

```typescript
const signer = await locklift.keystore.getSigner("0");
```

#### `locklift.provider.getBalance`

Get balance of account

##### Example

```javascript
const userBalance = await locklift.provider.getBalance(user.address);

expect(Number(userBalance)).to.be.above(0, "Bad user balance");
```

#### `locklift.transactions`

Module provides access to high-level control of transaction flow.

This method allows you to wait until all transaction in chain are finalized.

```typescript
const transaction = await locklift.transactions.waitFinalized(tokenRoot.methods.deployWallet({...))
```

#### `locklift.provider.getFullContractState`

Get full account state

##### Example

```typescript
expect(await locklift.provider.getFullContractState({ address: addr }).then(res => res.state?.isDeployed)).to.be.true;
```

#### `locklift.testing`

The module provides access to special testing utils, which available only with dev node

`locklift.testing.increaseTime`
with this method you can increase local node time by seconds

##### Example

```typescript
// increase time by 10 second
await locklift.testing.increaseTime(10);
// get current offset in seconds
const currentOffsetInSeconds = locklift.testing.getTimeOffset();
```

Note: this method increases your local node and provider time, we can't change the time back.
So if you need to reset the offset you will need to restart the local node.
**After each run locklift makes syncing the provider with the local node.**
And you will see the warning about current offset, please skip this warning if this is expected behavior,
otherwise just restart the local node

#### `locklift.context`

The module provides information about current context

##### Example

```typescript
const networkName = locklift.context.network.name; // network name which provided as --network param with locklift run command
const networkConfig = locklift.context.network.config; // network setting related with selected network
```

### Factory (`locklift.factory`)

This module provides the factory for getting sources of the contract and functionality for deploy contracts.
From factory you can receive contract objects from the project Solidity sources and contracts provided
in `config.extarnalContracts`.

#### `locklift.factory.getContractArtifacts`

Returns all compilation artifacts based on the .sol file name or name from value `config.extarnalContracts[pathToLib]`.

```typescript
const myContractData = await locklift.factory.getContractArtifacts("MyContract");
```

#### `locklift.factory.deployContract`

Deploy specified contract and returns contract instance and transaction.

```typescript
// Deploy
const {contract: DeployedMyContract, tx} = locklift.factory.deployContract({
  // name of your contract
  contract: "MyContractName",
  // public key in init data
  publicKey: signer.publicKey,
  // static parameters of contract
  initParams: {...},
  // runtime deployment arguments
  constructoParams: {...},
  // this value will be transfered from giver to deployable contract
  value: locklift.utils.toNano(2),
});
// Ot you can get instance of already deployed contract
const GettedMyContract = await locklift.factory.getDeployedContract(
  "Wallet", // name of your contract
  new Address("NyAddress"),
);
// In this example 'DeployedMyContract' and 'GettedMyContract' are the same contract
```

### Contract

Contract object includes all methods based on built sources (Abi). It is based on https://github.com/broxus/everscale-inpage-provider

```typescript
const MyContract = locklift.factory.getDeployedContract(
  "Wallet", //name infered from your contracts
  new Address("MyAddress"),
);
// Send External
await MyContract.methods.changeCounterState({ newState: 10 }).sendExternal({ publicKey: signer.publicKey });
// Run getter or view method
const counterSatate = await MyContract.methods.getCounterState({}).call();
// Await event that is still not emitted
const futureEvent = await MyContract.waitForEvent({ filter: event => event.event === "StateChanged" });
// Get past events
const pastEvents = await MyContract.getPastEvents({ filter: event => event.event === "Deposit" });
```

### AccountFactory (`locklift.factory.getAccountsFactory`)

This module provides the generic accountFactory. You can provide your own implementation of account if needed,
there is only one constraint - custom contract should include this method

```typescript
accountAbiBase = {
  functions: [
    {
      name: "sendTransaction",
      inputs: [
        { name: "dest", type: "address" },
        { name: "value", type: "uint128" },
        { name: "bounce", type: "bool" },
        { name: "flags", type: "uint8" },
        { name: "payload", type: "cell" },
      ],
      outputs: [],
    },
  ],
};
```

##### Example

```typescript
let accountsFactory = locklift.factory.getAccountsFactory(
  "Wallet", // name of contract used as a wallet
);
```

Now you can use it for deploying contract or getting deployed ones

#### Deploy

```typescript
const {contract: MyAccount, tx} = accountsFactory.deployNewAccount({
  publicKey: signer.publicKey,
  initParams: {
    _randomNonce: locklift.utils.getRandomNonce(),
  },
  constructorParams: {...},
  value: locklift.utils.toNano(100000)
});
```

#### Get account by address

```typescript
const Account = accountsFactory.getAccount(new Address("MyAddress"), signer.publicKey);
```

### Account

In most cases users interact with your contract through wallets with internal messages.
To make testing realistic we added `Account` class that allows you to imitate user and send all
transactions to contracts through wallet contract.

This class extends the basic `Contract` functionality by adding special `runTarget` method,
which allows to interact with another contracts, by sending internal message from "Account" contract.
It encodes the specified method + params into the internal message, according to the
target contract's ABI and call the Account's external method.

The basic Account contract can be found
here [Account.sol](https://github.com/broxus/ton-contracts/blob/master/contracts/wallets/Account.sol).

```typescript
const userAccount1 = accountsFactory.getAccount(new Address("MyAddress"), signer.publicKey);
// send tokens by interacting with tokenWallet contract
await userAccount1.runTarget(
  {
    contract: tokenWallet,
    value: locklift.utils.toNano(5),
  },
  tokenWallet =>
    tokenWallet.methods.transfer({
      amount: DEPOSIT_AMOUNT,
      payload: "",
      notify: true,
      remainingGasTo: userAccount1.address,
      recipient: bankContract.address,
      deployWalletValue: 0,
    }),
);
```

### Giver (`locklift.giver`)

This module allows you to send tokens. LockLift using GiverV2 by default, but you can use everything you want, just
reimplement it in giverSettings/index.ts.
`locklift.factory` is using the giver under the hood, for deploying contracts

### Utils

This module provides some utility functionality for more convenient work with TON objects.

#### `locklift.utils.toNano(amount)`

Multiplies amount by 10^9. Returns `string`.

##### Example

````typescript
locklift.utils.toNano(10); // 10000000000
locklift.utils.fromNano(10000000000); // 10```
````
