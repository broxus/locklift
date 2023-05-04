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

<p align="center">
  <a href="https://github.com/venom-blockchain/developer-program">
    <img src="https://raw.githubusercontent.com/venom-blockchain/developer-program/main/vf-dev-program.png" alt="Logo" width="366.8" height="146.4">
  </a>
</p>

Locklift is a development environment aiming to help you with Everscale contracts development. With Locklift, you get:

- Network management for working with any networks (main, test, local, ...)
- Automated contract testing with Mocha
- Handy wrapper around Everscale smart contract
- Custom givers support
- Keys management
- External script runner that executes scripts within a specified environment

## Quick start

To install Locklift you need node 14 or later. Go to an empty folder, initialize an npm project (i.e. npm init), and run

```bash
npm install --save-dev locklift
```

Once it's installed you can initialize the project

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

This command initializes new Locklift project, filled with samples:

```
├── contracts
│   └── Sample.sol
├── locklift.config.ts
├── scripts
│   └── 1-deploy-sample.ts
└── test
    └── sample-test.ts
```

### Other flags

`-f, --force` - force run the init command (in case you have any files in the target directory);

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
      // This giver is the default local-node giverV2
      giver: {
        // Check if you need to provide a custom giver
        // giverFactory: (ever, keyPair, address) => new SimpleGiver(ever, keyPair, address),
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

### Note about Giver settings:

Let's look at `networks.giver` this is giver settings filed. All known wallets and givers will be detected automatically e.g.
`EverWallet` or `GiverV2` (from local node). You only need to provide giver credentials - (address, secret key, or phrase with account id).
But if you want to use something custom you will need to provide `giverFactory`
callback for `networks.giver.giverFactory` that callback should return something that implements `Giver` interface

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

Note the `console.log` is just an event, so if your message dropped on the computed phase (e.g. `required` didn't pass),
you will not see the log message.

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

By default, tracing will throw an error on any non-zero code in the execution graph, but
sometimes in contract, we can expect some specific errors that could be processed later with bounced msgs.
In this cases, we don't want tracing to throw errors, because such behavior is expected.
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
// ignore compute(or acton) phase errors for all transactions
locklift.tracing.setAllowedCodes({ compute: [52, 60] });
// ignore more errors for specific address
locklift.tracing.setAllowedCodesForAddress(SOME_ADDRESS, { compute: [123], action: [111] });

// remove code from a default list of ignored errors so that only 51 errors will be ignored
// this affects only global rules, per-address rules are not modified
locklift.tracing.removeAllowedCodes({ compute: [60] });
// remove code from deault list of ignored errors for specific address
locklift.tracing.removeAllowedCodesForAddress(SOME_ADDRESS, { compute: [123] });
```

### Tracing features (EXPERIMENTAL FEATURES)

For using this feature first of all need to wrap the transaction by tracing, and make **sure that tracing is enabled**.
Otherwise, the `traceTree` will be **undefined**

#### example

```typescript
const { traceTree } = await locklift.tracing.trace(myContract.method.myMethod().send());
```

#### `tracingTree` methods

1. **Beauty print**

#### example

```typescript
await traceTree?.beautyPrint();
```

#### example output

```shell
CALL Wallet.sendTransaction{valueReceive: 0,valueSent: 3.9, rest: -3.910662⮯, totalFees: 0.010662}(dest="StEverVault(0:5db...a9bcf)", value="3900000000", bounce=true, flags="3", payload="te6c...pQ==")
 CALL StEverVault.startEmergencyProcess{valueReceive: 3.9,valueSent: 3.867427, rest: 0⮬, totalFees: 0.032573}(_poofNonce="50341")
  CALL StEverAccount.onStartEmergency{valueReceive: 3.867427,valueSent: 3.857346, rest: 0⮬, totalFees: 0.010081}(_proofNonce="50341")
   CALL StEverVault.startEmergencyRejected{valueReceive: 3.857346,valueSent: 3.831589, rest: 0⮬, totalFees: 0.025757}(_user="Wallet(0:ae6...10a56)", errcode="2004")
    EVENT StEverVault.EmergencyProcessRejectedByAccount(emitter="Wallet(0:ae6...10a56)", errcode="2004")
    TRANSFER Wallet.undefined{valueReceive: 3.831589,valueSent: 0, rest: 3.830589⮬, totalFees: 0.001}()

```

let's look at random raw in beaty print

`(1)CALL (2)StEverVault.(3)startEmergencyRejected{(4)valueReceive: 3.857346,(5)valueSent: 3.831589, (6)rest: 0⮬, (7)totalFees: 0.025757}((8)_user="Wallet(0:ae6...10a56)", errcode="2004")`

(1) Action type ,it can be (`CALL`, `EVENT`, `BOUNCE`, `TRANSFER`)

(2) Contract name

(3) Method name

(4) How many value(ever) the method received

(5) How many value(ever) the method sent

(6) How many ever left on contract after current transaction step (`valueReceive - valueSent - totalFees`)

(7) Total fees used in current step

(8) Method params, if params are included addresses it can be tried to find associated contract for it

2. **Ever balance diff**

This method is providing information about changing ever balance for a particular address or addresses

```typescript
const balanceChange = traceTree.getBalanceDiff(account.address);
// -1859458715 nano
```

3. **Token balance diff**

This method is providing information about changing token balance by a particular **token wallet**

```typescript
const tokenBalanceChange = traceTree?.tokens.getTokenBalanceChange(myUSDTTokenWalletContract.address);
// -1859458715 measurements depends of token decimals
```

4. **Getting information about calling methods and emitting events**

```typescript
// Events
const addEvents = traceTree?.findEventsForContract({
  contract: myContract,
  name: "Add" as const, // 'as const' is important thing for type saving
});

//Methods calls
const depositCalls = traceTree?.findCallsForContract({
  contract: myContract,
  name: "deposit",
});
```

5. **Total gas used**

This method is providing information about how much gas used after evaluating the full transaction

```typescript
const gasUsed = traceTree?.totalGasUsed();
// 256859 nano
```

### Tracing testing feature

For better testing your contracts you can use our `chai` plugin that includes to `locklift` package.

Just add this to your `locklift.config.ts`

```typescript
import { lockliftChai } from "locklift";
import chai from "chai";

chai.use(lockliftChai);
```

This plugin is providing useful things for testing everscale contract

1. `.emit`

With this method, you can test emitting events, like this

```typescript
expect(traceTree)
  .to.emit("Deposit")
  .withNamedArgs({
    amount: "150",
  })
  .and.emit("AccountDeployed")
  .withNamedArgs({
    user: "user address",
  })
  .count(1);
```

`.emit` method gets the event name as a first parameter and an optional parameter with the type
`type Addressable = Contract | Address | string;`

2. `.call`

With this method, you can test evaluating contract methods, as this

```typescript
expect(traceTree).to.call("depositToStrategies").withNamedArgs({...}).count(2)
```

`.call` parameters are the same as `.emit`

3. `.error`

With this method, you test cases with errors like this

```typescript
expect(traceTree).to.have.error(1025);
// expect(traceTree).not.to.have.error(1025);
```

All `.error` parameters are optional, so you can test particular errors or all errors that happened or not happened

And last but not least you can combine each of these methods e.g.

```typescript
expect(traceTree)
  .to.call("deposit")
  .withNamedArgs({
    depositor: "userAddress",
  })
  .count(1)
  .and.error(1065)
  .and.emit("Deposit")
  .withNamedArgs({
    depositor: "userAddress",
  })
  .count(1);
```

## Run script

This command runs an arbitrary Node JS script with an already configured `locklift` module.

```bash
npx locklift run --network local --script scripts/1-deploy-sample.ts
```

```
Sample deployed at: 0:a56a1882231c9d901a1576ec2187575b01d1e33dd71108525b205784a41ae6d0
```

# Locklift docs

This section describes the features of the `locklift` module.

#### `locklift.keystore`

Module provides access to keystore

##### Example

```typescript
const signer = await locklift.keystore.getSigner("0");
```

## Get Balance (`locklift.provider.getBalance`)

Get balance of account

##### Example

```javascript
const userBalance = await locklift.provider.getBalance(user.address);

expect(Number(userBalance)).to.be.above(0, "Bad user balance");
```

## Transactions (`locklift.transactions`)

The module provides access to high-level control of transaction flow.

This method allows you to wait until all transactions in the chain are finalized.

```typescript
const transaction = await locklift.transactions.waitFinalized(tokenRoot.methods.deployWallet({...}))
```

## Full contract state (`locklift.provider.getFullContractState`)

Get full account state

##### Example

```typescript
expect(await locklift.provider.getFullContractState({ address: addr }).then(res => res.state?.isDeployed)).to.be.true;
```

## Testing (`locklift.testing`)

The module provides access to special testing utils, which available only with the dev node

`locklift.testing.increaseTime`
with this method, you can increase local node time by seconds

##### Example

```typescript
// increase time by 10 seconds
await locklift.testing.increaseTime(10);
// get current offset in seconds
const currentOffsetInSeconds = locklift.testing.getTimeOffset();
```

Note: this method increases your local node and provider time, we can't change the time back.
So if you need to reset the offset you will need to restart the local node.
**After each run locklift makes syncing the provider with the local node.**
And you will see the warning about the current offset, please skip this warning if this is expected behavior,
otherwise, just restart the local node

## Context (`locklift.context`)

The module provides information about the current context

##### Example

```typescript
const networkName = locklift.context.network.name; // network name which provided as --network param with locklift run command
const networkConfig = locklift.context.network.config; // network setting related with selected network
```

## Factory (`locklift.factory`)

This module provides the factory with getting sources of the contract and functionality for deploying contracts.
From the factory, you can receive contract objects from the project Solidity sources and contracts provided
in `config.extarnalContracts`.

#### `locklift.factory.getContractArtifacts`

Returns all compilation artifacts based on the .sol file name or name from value `config.extarnalContracts[pathToLib]`.

```typescript
const myContractData = await locklift.factory.getContractArtifacts("MyContract");
```

### Deploy `locklift.factory.deployContract`

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
  value: toNano(2),
});
// Ot you can get instance of already deployed contract
const GettedMyContract = await locklift.factory.getDeployedContract(
  "Wallet", // name of your contract
  new Address("MyAddress"),
);
// In this example 'DeployedMyContract' and 'GettedMyContract' are the same contract
```

## Contract

The contract object includes all methods based on built sources (Abi). It is based
on https://github.com/broxus/everscale-inpage-provider

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

## locklift.factory.accounts

This module provides the possibility to interact with contracts directly e.g.

```typescript
myContract.methods.mint({}).send({
  //sender account
  from: myAccountAddress,
  amount: toNano(20),
});
```

For this flow need to add accounts to the `locklift.factory.accounts`. We are supporting WalletV3, HighLoadWallet,
MsigAccount
and other wallets which should provide directly

### Deploy and add new account to the account storage

For creating and adding a new account need to use `locklift.factory.accounts.addNewAccount` this method sends values and
deploys new account

### 1. WalletV3 or HighLoadWallet

```typescript
const account = await locklift.factory.accounts.addNewAccount({
  type: WalletTypes.EverWallet, // or WalletTypes.HighLoadWallet or WalletTypes.WalletV3,
  //Value which will send to the new account from a giver
  value: toNano(100000),
  //owner publicKey
  publicKey: signer.publicKey,
});
```

### 2. Msig like Wallets (e.g. [SafeMultisig like](https://github.com/broxus/ever-contracts/blob/master/contracts/wallets/Account.sol#L2-L3))

_Note: For custom wallets, needs to follow the same rules as for simple deploy(need to pass constructor and init
params)_

**Msig like Wallet should implement method sendTransaction
from** [Account](https://github.com/broxus/ever-contracts/blob/master/contracts/wallets/Account.sol#L2-L3))

```typescript
const account = await locklift.factory.accounts.addNewAccount({
  type: WalletTypes.MsigAccount,
  // Multisig type SafeMultisig supports 2.0 ABI version, multisig2 supports 2.3 ABI version
  mSigType: "SafeMultisig", // or SafeMultisig
  //Contract should included to the locklift.config.externalContracts or should compiled from contracts folder
  contract: "Account",
  //Value which will send to the new account from a giver
  value: toNano(100000),
  publicKey: signer.publicKey,
  constructorParams: {},
  initParams: {
    _randomNonce: getRandomNonce(),
  },
});
```

And then `account.address` can be used as sender.

#### Full example:

```typescript
const account = await locklift.factory.accounts.addNewAccount({
  type: WalletTypes.EverWallet, // or WalletTypes.HighLoadWallet or WalletTypes.WalletV3,
  //Value which will send to the new account from a giver
  value: toNano(100000),
  //owner publicKey
  publicKey: signer.publicKey,
  nonce: getRandomNonce(),
});

await myContract.methods.mint({}).send({
  //sender account
  from: account.address,
  amount: toNano(20),
});
```

### 3. Custom wallets

_Note this is very low level adding account method, so if you need to use something custom would be a better way to
use `2. Msig like Wallets`_ method

[MsigAccount](https://github.com/broxus/everscale-standalone-client/blob/dev/src/client/AccountsStorage/Generic.ts#L61-L107)
can be used as example for own implementation

#### example

```typescript
import {GenericAccount} from 'locklift/everscale-standalone-client'

const {abi: myMsigAccountAbi} = locklift.factory.getContractArtifacts("MyMsigAccount");

//derived from https://github.com/broxus/everscale-standalone-client/blob/dev/src/client/AccountsStorage/Generic.ts#L61-L107
class MyMsigAccount extends GenericAccount {
  constructor(args: {
    address: string | Address,
    publicKey?: string
  }) {
    super({abi: myMsigAccountAbi, ...});
  }
}

const signer = await locklift.keystore.getSigner('0')
const {contract: myMsigContract} = await locklift.factory.deployContract({
  contract: "MyMsigAccount",
  constructorParams: {},
  initParams: {
    _randomNonce: getRandomNonce(),
  },
  value: toNano(10),
  publicKey: signer.publicKey,
});
const myMsigAccount = new MyMsigAccount({address: myMsigContract.address, publicKey: signer.publicKey})
locklift.factory.accounts.storage.addAccount(myMsigAccount)

await myContract.methods.mint({}).send({
  //sender account
  from: myMsigAccount.address,
  amount: toNano(20),
});

```

### Using an existing account

```typescript
const everWalletAccount = await locklift.factory.accounts.addExistingAccount({
  address: "MyAddress",
  type: WalletTypes.EverWallet,
});

const walletV3Account = await locklift.factory.accounts.addExistingAccount({
  publicKey: signer.publicKey,
  type: WalletTypes.WalletV3,
});
const mySafeMultisigAccount = await locklift.factory.accounts.addExistingAccount({
  publicKey: signer.publicKey,
  type: WalletTypes.Custom,
  address: "MyAddress",
});

await myContract.methods.mint({}).send({
  //sender account
  from: mySafeMultisigAccount.address, // walletV3Account.address
  amount: toNano(20),
});
```

## ~~AccountFactory~~ (`locklift.factory.getAccountsFactory`)

this is deprecated since 2.2.0, use `locklift.factory.accounts` instead

This module provides the generic account factory. You can provide your own implementation of the account if needed,
there is only one constraint - the custom contract should include this method

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

### Get account by address

```typescript
const Account = accountsFactory.getAccount(new Address("MyAddress"), signer.publicKey);
```

### Account

In most cases users interact with your contract through wallets with internal messages.
To make testing realistic we added `Account` class that allows you to imitate user and send all
transactions to contracts through wallet contract.

This class extends the basic `Contract` functionality by adding special `runTarget` method,
which allows interaction with other contracts, by sending internal messages from "Account" contract.
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

## Giver (`locklift.giver`)

This module allows you to send native tokens.
`locklift.factory` is using the giver under the hood, for deploying contracts

## Utils

This module provides some utility functions for more convenient work with Ever objects.

##### Example

````typescript
import { toNano, fromNano, getRandomNonce, convertAmount, isValidEverAddress, stringToBytesArray } from "locklift";

toNano(10); // 10000000000
fromNano(10000000000); // 10```
````

## Plugins

1. [locklift-verify](https://github.com/broxus/locklift-verifier)
2. [locklift-deploy](https://github.com/broxus/locklift-deploy)
3. [locklift-plugin-boilerplate(example of implementation)](https://github.com/broxus/locklift-plugin-boilerplate)
