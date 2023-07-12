---
title: Debug & Testing Contracts
outline: deep
---

# Debug & Testing Contracts

After you've written and compiled your smart contracts, the next crucial step is to test them to ensure they behave as intended. This process involves creating test cases that cover different scenarios and edge cases that your contract might encounter. This guide will introduce you to the recommended approach for testing contracts using Locklift.

Locklift is a Node.js-based framework for developing, testing, deploying, and maintaining smart contracts on TVM-compatible blockchains. It provides a set of tools and utilities that simplify the process of interacting with the blockchain, managing keys, deploying contracts, and testing them.

## Inital Setup

Before you can write and run tests, you need to set up your testing environment. This guide assumes you've already set up a Locklift project. If you haven't done so, please refer to the [Setting Up A Project](./setting-up-a-project.md) section in the documentation.

In a Locklift project, tests are typically written in TypeScript and located in the `test` directory. TypeScript is recommended because it provides better autocompletion and can catch potential errors earlier, but you can also use JavaScript if you prefer.

When you initialize a new Locklift project, a simple test is automatically generated in the `test` directory. This test serves as a starting point and can be customized to suit the specific requirements of your contract.

## Simple Test

Writing tests involves defining test cases that verify the behavior of your contract. Each test case should focus on a specific function or feature of your contract.

In Locklift, tests are written using [Mocha](https://mochajs.org/), a JavaScript test framework, and [Chai](https://www.chaijs.com/), a BDD/TDD assertion library. Mocha provides functions to define test suites (`describe`) and test cases (`it`), while Chai provides functions to assert the behavior of your contract (`expect`).

A simple test in Locklift might look like the following:

```typescript
import { expect } from 'chai';
import { Contract, Signer } from 'locklift';
import { FactorySource } from '../build/factorySource';

// Declare the contract and signer variables
let sample: Contract<FactorySource['Sample']>;
let signer: Signer;

// Define the test suite
describe('Test Sample contract', async function () {
  // Before running the tests, get the signer
  before(async () => {
    signer = (await locklift.keystore.getSigner('0'))!;
  });

  describe('Contracts', async function () {
    // Test case for loading the contract factory
    it('Load contract factory', async function () {
      const sampleData = await locklift.factory.getContractArtifacts(
        'Sample'
      );

      // Assert that the code, abi, and tvc are available
      expect(sampleData.code).not.to.equal(
        undefined,
        'Code should be available'
      );
      expect(sampleData.abi).not.to.equal(
        undefined,
        'ABI should be available'
      );
      expect(sampleData.tvc).not.to.equal(
        undefined,
        'tvc should be available'
      );
    });

    // Test case for deploying the contract
    it('Deploy contract', async function () {
      const INIT_STATE = 0;
      const { contract } = await locklift.factory.deployContract({
        contract: 'Sample',
        publicKey: signer.publicKey,
        initParams: {
          _nonce: locklift.utils.getRandomNonce(),
        },
        constructorParams: {
          _state: INIT_STATE,
        },
        value: locklift.utils.toNano(2),
      });

      // Store the deployed contract
      sample = contract;

      // Assert that the contract has a balance
      expect(
        await locklift.provider
          .getBalance(sample.address)
          .then(balance => Number(balance))
      ).to.be.above(0);
    });

    // Test case for interacting with the contract
    it('Interact with contract', async function () {
      const NEW_STATE = 1;

      // Call the setState method of the contract
      await sample.methods
        .setState({ _state: NEW_STATE })
        .sendExternal({ publicKey: signer.publicKey });

      // Call the getDetails method of the contract
      const response = await sample.methods.getDetails({}).call();

      // Assert that the state is updated correctly
      expect(Number(response._state)).to.be.equal(
        NEW_STATE,
        'Wrong state'
      );
    });
  });
});
```

In this test, we first load the contract factory and verify that the `code`, `ABI`, and `tvc` are available. Then, we deploy the contract and assert that it has a balance. Finally, we interact with the contract by calling its methods and asserting that the state is updated correctly. This simple example demonstrates the basic structure of a test in Locklift. In practice, your tests will likely be more complex and cover a wider range of scenarios. However, the principles remain the same: load your contract, deploy it, interact with it, and assert that it behaves as expected.

## Debugging

In smart contracts, you can print to the console using a special library:

```solidity
import "locklift/src/console.sol";

contract Sample {
  function testFunc(uint input) external {
    tvm.accept();

    console.log(format("You called testFunc with input = {}", input));
  }
}
```

Note: `console.log` functionality only works with tracing, for example:

```typescript
await lockLift.tracing.trace(
  sampleContract
    .testFunc({ input: 10 })
    .sendExternal({ pubkey: keyPair.publicKey })
);
```

After running the above, you will see this in your terminal:

```
You called testFunc with input = 10
```

:::warning Caution

It's important to note that `console.log` is just an event, so if your message drops on the computed phase (for instance, if `required` doesn't pass), you will not see the log message.

:::

## Catching Events and Calls

While it is crucial to test the general behavior of your smart contracts, you might also be interested in inspecting more specific elements such as emitted events or contract calls. In this section, we'll explore how you can use Locklift's features to catch and examine these occurrences.

### Events

Smart contracts often emit events to indicate certain activities or state changes. Locklift's `findEventsForContract` method allows you to catch and investigate these events. Here's an example:

```typescript
// Test case for catching an event
it('Catch an event', async function () {
  // Interact with the contract
  const NEW_STATE = 2;
  const { traceTree } = await locklift.tracing.trace(
    sample.methods
      .setState({ _state: NEW_STATE })
      .sendExternal({ publicKey: signer.publicKey })
  );

  // Catch the events
  const events = traceTree?.findEventsForContract({
    contract: sample,
    name: 'StateChange' as const,
  }); // 'as const' is important thing for type saving;

  // Assert the events are correct
  expect(events?.[0]._state).to.be.equal('2', 'Wrong state');
});
```

In this test, we interact with the contract, then use `findEventsForContract` to catch an event named 'StateChange'. We then assert that the event was indeed emitted.

### Calls

Your contract might also make specific function calls, especially when interacting with other contracts. To verify these interactions, Locklift provides the `findCalls` method. Here's how you can use it:

```typescript
// Test case for catching a call
it('Catch a call', async function () {
  const NEW_STATE = 7;
  const { traceTree } = await locklift.tracing.trace(
    sample.methods
      .setState({ _state: NEW_STATE })
      .sendExternal({ publicKey: signer.publicKey })
  );

  // Catch the calls
  const calls = traceTree?.findCallsForContract({
    contract: sample,
    name: 'setState' as const,
  });
  console.log(calls);
  // Assert that the call was made
  expect(calls?.[0]._state).to.be.equal('7', 'Wrong state');
});
```

Here, after interacting with the contract, we use `findCallsForContract` to catch a call to a function named `setState`, then assert that the call was indeed made.

:::info

If an event doesn't carry any value, or if a function is called without arguments, the `findEventsForContract` and `findCallsForContract` methods will return a list with an empty dictionary `{}` inside.

```typescript
[{}];
```

:::

## Time Movement

In the process of testing smart contracts, you may encounter situations where it is necessary to manipulate time. This is particularly relevant when testing functions that operate based on time-dependent logic, such as those implementing delays or time-locked actions. Locklift's `locklift.testing` module provides a set of utilities specifically designed for these scenarios, available only when operating with a development node.

### Increasing Time

The `locklift.testing.increaseTime` method allows you to advance the local node's time by a specified number of seconds.

```typescript
// Increase time by 10 seconds
await locklift.testing.increaseTime(10);
```

This method increases both your local node and provider time. It's important to note that it's not possible to reverse the time. If you need to reset the offset, you will have to restart the local node.

### Getting Current Time Offset

The `locklift.testing.getTimeOffset` method returns the current time offset in seconds. This can be helpful for tracking the time adjustments you've made.

```typescript
// Get the current time offset in seconds
const currentOffsetInSeconds = locklift.testing.getTimeOffset();
```

### Getting Current Time

To retrieve the current time, you can use the `locklift.testing.getCurrentTime` method. This method returns the current time considering the offset you may have set using `locklift.testing.increaseTime`.

```typescript
// Get the current time
const currentTime = locklift.testing.getCurrentTime();
```

After each run, Locklift synchronizes the provider with the local node. If you see a warning about the current offset, you can ignore it if this is the expected behavior. Otherwise, you should restart the local node.

These utilities are essential for creating precise and accurate tests for your smart contracts, ensuring that they function correctly under different time conditions.

## Tracing

Tracing is a powerful feature in Locklift that allows you to examine the execution of smart contracts in detail. By using the tracing module, you can scan the message tree, identify which contracts have been deployed, and decode all method calls. If an error occurs during execution, tracing can show the sequence of calls that led to the error, as well as the error itself.

:::tip Note
Please note that to use tracing, you must provide a tracing endpoint to the config that supports GraphQL.
:::

```typescript
// trace deploy
const {contract: deployedContractInstance, tx} = await locklift.tracing.trace(locklift.factory.deployContract(...))
// trace simple transaction
const changeStateTransaction = await locklift.tracing.trace(MyContract.methods.changeCounterState({newState: 10}).sendExternal({publicKey: signer.publicKey}))
// trace runTarget
const accountTransaction = await locklift.tracing.trace(myAccount.runTarget(...))
```

Here's an example of tracing output:

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

### Ignoring Errors

By default, tracing will throw an error for any non-zero code in the execution graph. However, there might be situations where you expect certain errors, such as those that can be handled later with bounced messages. In these cases, you don't want tracing to throw errors because such behavior is expected. You can instruct tracing to ignore specific errors on the compute or action phases.

You can ignore errors on a specific call:

```typescript
// Tracing will ignore all 51 and 60 errors on compute phase + 30 error on action phase
// Here 51 compute and 30 action errors will be ignored for all transactions in the message chain and 60 compute error
// will be ignored only on a specific address
const transaction = await locklift.tracing.trace(
  tokenRoot.methods
    .sendTokens({ walletOwner: '' })
    .sendExternal({ publicKey: signer.publicKey }),
  {
    allowedCodes: {
      //compute or action phase for all contracts
      compute: [40],
      //also you can specify allowed codes for a specific contract
      contracts: {
        [someAddress.toString()]: {
          action: [52, 60],
        },
      },
    },
  }
);
```

Or set ignoring by default for all further calls:

```typescript
// ignore compute(or action) phase errors for all transactions
locklift.tracing.setAllowedCodes({ compute: [52, 60] });
// ignore more errors for a specific address
locklift.tracing.setAllowedCodesForAddress(SOME_ADDRESS, {
  compute: [123],
  action: [111],
});

// remove code from the default list of ignored errors so that only 51 errors will be ignored
// this affects only global rules, per-address rules are not modified
locklift.tracing.removeAllowedCodes({ compute: [60] });
// remove code from the default list of ignored errors for a specific address
locklift.tracing.removeAllowedCodesForAddress(SOME_ADDRESS, {
  compute: [123],
});
```

### Tracing Features (Experimental)

For using these features, first, you need to wrap the transaction by tracing, and make sure that tracing is enabled. Otherwise, the `traceTree` will be undefined.

```typescript
const { traceTree } = await locklift.tracing.trace(
  myContract.method.myMethod().send()
);
```

#### Beauty Print

The `beautyPrint` method provides a detailed and formatted output of the tracing results. This can be very helpful in understanding the execution flow of your smart contracts.

```typescript
await traceTree?.beautyPrint();
```

#### Ever Balance Diff

The `getBalanceDiff` method provides information about the change in ever balance for a particular address or addresses.

```typescript
const balanceChange = traceTree.getBalanceDiff(account.address);
// -1859458715 nano
```

#### Token Balance Diff

The `getTokenBalanceChange` method provides information about the change in token balance for a particular token wallet.

```typescript
const tokenBalanceChange = traceTree?.tokens.getTokenBalanceChange(
  myUSDTTokenWalletContract.address
);
// -1859458715 measurements depends on token decimals
```

### Tracing Test Features

In addition to catching and examining events and calls, you may want to assert their occurrences. Locklift's `chai` plugin comes equipped with the `expect` method, making assertions simpler and more intuitive.

First, include the plugin in your `locklift.config.ts`:

```typescript
import { lockliftChai } from 'locklift';
import chai from 'chai';

chai.use(lockliftChai);
```

With this plugin integrated, you gain access to a range of testing methods:

#### emit

This method allows you to test whether specific events have been emitted:

```typescript
expect(traceTree)
  .to.emit('Deposit')
  .withNamedArgs({
    amount: '150',
  })
  .and.emit('AccountDeployed')
  .withNamedArgs({
    user: 'user address',
  })
  .count(1);
```

The `.emit` method takes the event name as the first parameter and an optional parameter of the type `type Addressable = Contract | Address | string;`.

#### call

The `.call` method is used to test the invocation of contract methods:

```typescript
expect(traceTree).to.call("depositToStrategies").withNamedArgs({...}).count(2)
```

The parameters for the `.call` method are identical to the `.emit` method.

#### error

Use the `.error` method to test cases that should produce errors:

```typescript
expect(traceTree).to.have.error(1025);
// expect(traceTree).not.to.have.error(1025);
```

All `.error` method parameters are optional, allowing you to test for specific errors or verify whether any errors occurred.

You can also chain these methods together, allowing for a more comprehensive test:

```typescript
expect(traceTree)
  .to.call('deposit')
  .withNamedArgs({
    depositor: 'userAddress',
  })
  .count(1)
  .and.error(1065)
  .and.emit('Deposit')
  .withNamedArgs({
    depositor: 'userAddress',
  })
  .count(1);
```
