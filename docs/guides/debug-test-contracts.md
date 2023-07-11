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

I apologize for misunderstanding your request. Here's the edited section where `.emit`, `.call`, and `.error` are represented as subheadings:

### Asserting Events and Calls

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

With these methods, Locklift offers a robust and flexible suite for contract testing.
