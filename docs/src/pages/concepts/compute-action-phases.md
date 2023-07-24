---
title: Compute & Action Phases
outline: deep
---

# Concept of Compute and Action Phases

In the context of TVM-compatible blockchains, the "Compute and Action Phases" are critical concepts associated with the execution of smart contracts. These phases represent the primary stages of message processing in smart contracts. While other phases exist, developers often rely heavily on the Compute and Action phases.

Understanding these phases is crucial for effective smart contract development and efficient interaction with the TVM blockchain.

<BDKImgContainer imageSrc="./../src/diagrams/compute-and-action-phases.png" />

## Compute Phase

The Compute Phase is the first stage where the TVM executes the smart contract code invoked by a message. During this phase, all computations and state updates of the contract that do not interact with other contracts occur. The Compute Phase is deterministic, its outcome solely dependent on the input data and the current state of the smart contract.

Executing in an isolated environment, this phase ensures the integrity and security of the computations. If an exception occurs during the Compute Phase (e.g., due to out-of-gas errors), the entire transaction is aborted, and the Action Phase does not commence. At the end of this phase, the TVM prepares a set of "output messages" to be dispatched in the Action Phase.

## Action Phase

The Action Phase is the stage where the output messages created during the Compute Phase are dispatched. Actions that may occur during this phase include calling other smart contracts and any other actions specified in the output messages. These calls can lead to various outcomes such as token transfers and state changes of the receiving contract.

The Action Phase enables the smart contract's interaction with other contracts within the blockchain network. However, the actual state changes only occur if the Action Phase is successfully completed.

:::warning Сaution
There's a maximum limit of 255 actions that can be dispatched during the Action Phase. This limit includes internal outbound messages and event messages. Exceeding this limit will cause the transaction to be aborted.
:::

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
