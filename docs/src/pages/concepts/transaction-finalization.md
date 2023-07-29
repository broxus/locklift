---
outline: deep
---

# Concept of Transaction Finalization

In the world of blockchain technology, the concept of transaction finalization is pivotal. It refers to the process of confirming and validating transactions within the network, ensuring their immutability and integration into the blockchain. This document aims to delve deeper into the specifics of transaction finalization in the context of TVM-compatible blockchains, which operate based on a pure actor model.

## Actor Model & Async Transactions

TVM-compatible blockchains operate based on a pure actor model, an asynchronous and concurrent computational model. In this system, each contract acts as an independent actor, processing its own messages. Hence, the execution of a smart contract or transaction is not a single, atomic operation. Instead, it's a sequence of actions that can happen asynchronously.

For instance, let's imagine `Contract A` calling `Contract B`. In many other blockchain models, if `Contract B` runs out of gas during execution, the entire transaction would be rolled back, including the state changes in `Contract A` that occurred prior to the call. However, in the actor model of TVM blockchains, if `Contract B` encounters an error, the changes `Contract A` made before calling `Contract B` would persist. The execution failure of `Contract B` only rolls back changes related to `Contract B`'s execution. This characteristic ensures a higher degree of reliability and security in transaction processing.

### Demonstration

<br>
<BDKImgContainer imageSrc="./../transaction-finalization.png" />

<br>
<TransactionFinalization />

To demonstrate this concept, consider the TypeScript example below. It interacts with two smart contracts, `Contract A` and `Contract B`. `Contract A` calls a function on `Contract B`, which runs out of gas and fails. The state changes in `Contract B` are rolled back, but the state changes in `Contract A` persist.

```typescript
import {
  Address,
  ProviderRpcClient,
} from 'everscale-inpage-provider';
import { testContract, toNano } from './../../helpers';

const provider = new ProviderRpcClient();

async function fetchStates() {
  const ContractA = new provider.Contract(
    testContract.ABI,
    new Address(testContract.address)
  );
  const ContractB = new provider.Contract(
    testContract.ABI,
    new Address(testContract.dublicateAddress)
  );

  const { _state: prevState_A } = await ContractA.methods
    .getDetails()
    .call();
  const { _state: prevState_B } = await ContractB.methods
    .getDetails()
    .call();

  console.log(`prevState_A: ${prevState_A}`);
  console.log(`prevState_B: ${prevState_B}`);
}

async function executeTransaction() {
  try {
    await provider.ensureInitialized();
    const { accountInteraction } = await provider.requestPermissions({
      permissions: ['basic', 'accountInteraction'],
    });

    const ContractA = new provider.Contract(
      testContract.ABI,
      new Address(testContract.address)
    );

    const senderAddress = accountInteraction?.address!;

    await fetchStates();

    const { _state: prevState_A } = await ContractA.methods
      .getDetails()
      .call();

    const payload = {
      abi: JSON.stringify(testContract.ABI),
      method: 'setOtherState',
      params: {
        other: new Address(testContract.dublicateAddress),
        _state: Number(prevState_A) + 1,
        count: 256,
      },
    };
    const { transaction: tx } = await provider.sendMessage({
      sender: senderAddress,
      recipient: new Address(testContract.address),
      amount: toNano(0.3),
      bounce: true,
      payload: payload,
    });

    console.log(`Transaction: ${JSON.stringify(tx, null, 2)}`);

    const subscriber = new provider.Subscriber();
    const traceStream = subscriber.trace(tx);

    traceStream.on(async data => {
      if (data.aborted) {
        await fetchStates();
        traceStream.stopProducer();
      }
    });
  } catch (err: any) {
    console.log(`Error: ${err.message || 'Unknown Error'}`);
  }
}

executeTransaction();
```

In this example, `Contract A` calls the `setOtherState()` function, which changes the state of `Contract A` and calls the `increaseState()` function on `Contract B`. The `increaseState()` function is designed to fail due to insufficient gas. When this function fails, the state changes in `Contract B` are rolled back, but the state changes in `Contract A` persist, demonstrating the asynchronous nature of transactions in TVM-compatible blockchains.

Here are the functions from the smart contract:

```solidity
function setOtherState (ISample other, uint _state, uint count) public cashBack {
    state = _state;
    other.increaseState{
        value: 0.2 ever,
        flag: 2,
        bounce: false
    }(count);
}

function increaseState(uint count) public  {
    tvm.rawReserve(address(this).balance - msg.value, 2);
    for (uint i = 0; i < count; i++) {
        state++;
        emit StateChange(state);
    }
    msg.sender.transfer({ value: 0, flag: 129 });
}
```

## Transaction Flows

Transactions in these blockchains are part of a continuous, asynchronous process where numerous actors interact, process messages, and modify states. Each smart contract (actor) follows a specific behavior pattern, responding to events, executing its code, modifying its own properties, optionally generating outgoing messages, and then going into standby mode until the next event occurs. These sequences form an `AccountChain`, a chain of transactions for a single account, which is then included in a block without disrupting the sequencing.

When considering multiple accounts, we have multiple `AccountChains` forming a `ShardChain`, which can be dynamically split and merged depending on the transaction load. Ultimately, all shards that contain all accounts following a set of rules form a Blockchain, where multiple blockchains can operate simultaneously and interact with each other.

## Logical Time in Transactions

Every transaction within the TVM-compatible blockchain is assigned a logical time interval. This logical time serves as a unique identifier for transactions and outbound messages of an account. The logical time intervals of transactions of the same account do not intersect each other, thus ensuring that all outbound messages generated by an account are unique and identifiable.

## Components of a Transaction

Each transaction within the TVM-compatible blockchain contains or indirectly refers to the following data:

- The account to which the transaction belongs.
- The logical time of the transaction.
- An inbound message processed by the transaction. Each transaction is always initiated by this message.
- The number of generated outbound messages.
- The outbound messages themselves.
- The initial and final state of the account, including its balance.
- The total fees collected by the validators.
- A detailed description of the transaction containing all or some data needed to validate it.

## Types of Transactions

There are different types of transactions allowed in the blockchain, each serving a unique purpose:

- **Ordinary transactions:** These belong to an account and process exactly one inbound message, compute the new state of the account, and generate several outbound messages.
- **Storage transactions:** These transactions do not process any inbound message and do not invoke any code. Their only effect is to collect storage payments from an account, affecting its storage statistics and its balance.
- **Tick and Tock transactions:** These are automatically invoked for certain special accounts in the masterchain that have the tick flag set in their state, as the very first transactions in every masterchain block or the very last transactions in every masterchain block.
- **Split and Merge transactions:** These are invoked as the last transactions of shardchain blocks immediately preceding a shardchain split event or immediately after a shardchain merge event, if an instance of a large smart contract needs to be merged with another instance of the same smart contract.

## Transaction Processing Phases

The processing of an inbound message is split into two phases: the computing phase and the action phase. During the computing phase, the virtual machine is invoked and the necessary computations are performed, but no actions outside the virtual machine are taken. The actions themselves are postponed until the action phase, during which the user smart contract is not invoked at all.

:::tip
To gain a deeper understanding of the Compute and Action phases, please refer to our detailed guide [here](./compute-action-phases.md).
:::
