---
outline: deep
---

# Concept of Compute and Action Phases

In the context of TVM-compatible blockchains, the "Compute and Action Phases" are critical concepts associated with the execution of smart contracts. These phases represent the primary stages of message processing in smart contracts. While other phases exist, developers often rely heavily on the Compute and Action phases.

Understanding these phases is crucial for effective smart contract development and efficient interaction with the TVM blockchain.

## Compute Phase

The Compute Phase is the first stage where the TVM executes the smart contract code invoked by a message. During this phase, all computations and state updates of the contract that do not interact with other contracts occur. The Compute Phase is deterministic, its outcome solely dependent on the input data and the current state of the smart contract.

Executing in an isolated environment, this phase ensures the integrity and security of the computations. If an exception occurs during the Compute Phase (e.g., due to out-of-gas errors), the entire transaction is aborted, and the Action Phase does not commence. At the end of this phase, the TVM prepares a set of "output actions" for dispatch during the Action Phase.

## Action Phase

The Action Phase is the stage where the output messages created during the Compute Phase are dispatched. Actions that may occur during this phase include calling other smart contracts and any other actions specified in the output messages. These calls can lead to various outcomes such as token transfers and state changes of the receiving contract.

The Action Phase enables the smart contract's interaction with other contracts within the blockchain network. However, the actual state changes only occur if the Action Phase is successfully completed.

:::warning Сaution
There's a maximum limit of 255 actions that can be dispatched during the Action Phase. This limit includes internal outbound messages, event messages, rawReserve, setCode. Exceeding this limit will cause the transaction to be aborted.
:::

## Demonstration

<BDKImgContainer src="./../compute-and-action-phases.png" altText="Compute and action phases diagram" padding="20px 0 20px 0"/>

<br>
<ComputeActionPhases />

To enhance our understanding of the Compute and Action Phases, let's consider three different scenarios.

**Scenario 1:** A successful execution of a smart contract with a function `increaseState` that emits an event 253 times, performs a raw reserve operation at the beginning, and sends back the "change" to the caller at the end of the function. This process results in exactly 255 actions, the maximum limit for the Action Phase.

**Scenario 2:** A failed execution due to a gas shortage. We simulate this by clicking the "Call with Gas Failure" button.

**Scenario 3:** A failed execution due to exceeding the maximum limit of 255 actions during the Action Phase. We simulate this by clicking the "Failure with 256 actions" button.

Here is the function in the smart contract:

```solidity
function increaseState(uint count) public  {
    tvm.rawReserve(address(this).balance - msg.value, 2);

    for (uint i = 0; i < count; i++) {
        state++;
        emit StateChange(state);
    }

    msg.sender.transfer({ value: 0, flag: 129 });
}
```

In the TypeScript code, we subscribe to the `StateChange` event and call the `increaseState` function. Here's how we do it:

```typescript
const contractEvents = exampleContract.events(subscriber);

const eventCallback = (event: any) => {
  console.log(JSON.stringify(event, null, 2));
  contractEvents.stopProducer();
};

contractEvents.on(eventCallback);

const payload = {
  abi: JSON.stringify(testContract.ABI),
  method: 'increaseState',
  params: {
    count: 253,
  },
};

await provider.sendMessage({
  sender: senderAddress,
  recipient: new Address(testContract.address),
  amount: toNano(1),
  bounce: true,
  payload: payload,
});
```

When we click the "Call Contract" button for the first scenario, we get a response similar to the following:

```json
{
  "event": "StateChange",
  "data": {
    "_state": "759"
  },
  "transaction": {
    ...
    "outMessages": [
      ...
    ]
  }
}
```

However, if we simulate a gas failure by clicking the "Call with Gas Failure" button for the second scenario, we get a different response:

```json
{
  "id": {
    ...
  },
  "aborted": true,
  "exitCode": -14,
  ...
}
```

Now, let's consider the third scenario where we exceed the maximum limit of 255 actions. When we click the "Failure with 256 actions" button, the transaction is aborted with an resultCode 33, indicating that the maximum number of actions in the Action Phase was exceeded:

```json
{
  "id": {
    ...
  },
  "aborted": true,
  "exitCode": 0,
  "resultCode": 33,
  ...
}
```

In this case, no events are emitted, and the transaction is not completed.

## Additional Transaction Phases

While the Compute and Action phases are the primary focus for developers, a complete transaction in the TVM-compatible blockchain also includes a few additional phases:

### Storage Phase

The Storage Phase collects due storage payments for the account state (including smart-contract code and data, if present) up to the present time. The smart contract may be frozen as a result. If the smart contract did not exist before, the storage phase is absent.

### Credit Phase

During the Credit Phase, the account is credited with the value of the inbound message received.

### Bounce Phase

If the transaction is aborted (for instance, due to a failure in the Compute or Action phases), and the inbound message has its bounce flag set, then it is "bounced" by automatically generating an outbound message (with the bounce flag clear) to its original sender. Almost all value of the original inbound message (minus gas payments and forwarding fees) is transferred to the generated message, which otherwise has an empty body.

Please note, these additional phases are less frequently encountered in regular smart contract development but understanding them provides a more complete picture of transaction processing in TVM-compatible blockchains.

:::info Note
The separation of the Compute and Action Phases is designed to ensure the security and predictability of smart contract execution. All computations occur in an isolated environment during the Compute Phase, and only after all computations are completed and verified does the interaction with other contracts occur in the Action Phase.
:::
