---
outline: deep
---

# Concept of Internal & External Messages

In TON Virtual Machine (TVM) blockchains, messages are integral to facilitating interactions between smart contracts or between smart contracts and external applications. Messages essentially serve as the main communication medium, enabling contracts to execute various operations. Messages are categorized into three types:

- External Inbound Messages
- Internal Messages
- External Outbound Messages

## External Inbound Messages

External inbound messages are a type of communication in blockchain technology that originate outside the blockchain. These messages are used to deploy and call contracts, and they do not carry any value nor a source address, but do possess a destination address. Importantly, they are allocated a gas credit of 10k by validators. This gas credit is crucial for the execution of the transaction, as it invokes the contract and passes on the message.

The concept of gas credit is best illustrated by considering wallet contracts. In this context, gas credit is used to verify that a message is signed with the owner's key. If this verification fails, the `tvm.accept()` method is not invoked, the transaction fails, and the wallet does not spend any money, i.e., it does not pay the 10k gas credit.

The `tvm.accept()` method is a mechanism used to confirm that the contract agrees to pay for the transaction from its account within the 10k gas credit limit. If `tvm.accept()` is invoked, the transaction continues, and the contract can create additional outbound messages. However, if an exception occurs, or the contract does not invoke `tvm.accept()`, or the gas credit runs out, the message is discarded and does not enter the blockchain.

Here's a simple example of a function that uses the `tvm.accept()` method:

```solidity
function set(uint _value) external checkOwnerAndAccept {
  require(msg.pubkey() == tvm.pubkey(), 102);
  tvm.accept();
  variable = _value;
}
```

## Replay Protection

Replay protection is essential in a blockchain environment, especially in the context of external inbound messages. Without replay protection, the same external message could be included in the blockchain an indefinite number of times, as long as the contract agrees to pay for it. Therefore, each contract must implement its own replay protection mechanism.

In the TON Solidity compiler, a simple built-in replay protection mechanism is provided. This mechanism includes a hidden static variable, `uint64 timestamp`, which records the time of the last external message. The compiler generates a check that verifies whether the time of the last accepted message is less than that of the new one, and updates the time accordingly.

However, this built-in protection is quite primitive and may not work well if many external messages are sent in parallel. Moreover, if your contract has errors that occur after `tvm.accept()`, the transaction will fail, and the contract state will be rolled back to the beginning. This means that the timestamp will not be updated, and the validator can include this external message as many times as they want, as long as there are coins on the contract balance or the message has not expired.

In such circumstances, you may want to consider implementing your own replay protection by declaring a special function called [`afterSignatureCheck`](https://github.com/tonlabs/TON-Solidity-Compiler/blob/master/API.md#aftersignaturecheck).

To prevent this, it's recommended to perform all checks before invoking `tvm.accept()`. Also, when sending value, use flag + 2 where possible. This means that if any errors occur during the sending of this message, such a message should simply be ignored. Alternatively, make sure you have enough coins for sending.

In addition to the `AbiHeader time` pragma, there are also:

- `AbiHeader expire`: This pragma adds an expire header, instructing the SDK to add to the message the time after which this message is considered invalid, and the compiler checks it against the block time.
- `AbiHeader pubkey`: This pragma instructs the SDK/compiler that all external messages must be signed with a private key, and the compiler adds a signature check. The signature doesn't necessarily have to be from the same public key set as `tvm.pubkey()`. The SDK can sign with any pair of keys and attach the public key to check the signature to the message. Therefore, we do a `tvm.pubkey() == msg.pubkey()` check when receiving external messages. This pragma should always be added if you will be receiving external messages.

Remember, the goal of these mechanisms is to ensure the integrity and security of the transactions within the blockchain.

## Internal Messages

Internal messages facilitate communication between smart contracts within the blockchain. They contain both a source and a destination address and can carry value. They enable contracts to interact with each other and perform operations like invoking methods and transferring value.

Each internal message is unique, containing its full source address along with its logical creation time. Outbound messages created by the same smart contract have strictly increasing logical creation times, enabling you to find a message by its hash. The order of internal messages is preserved by their logical time, and their delivery is guaranteed.

The `dest.transfer(value)` function creates an internal message with a value in Native Coins, which invokes the `receive()` function in the receiving contract without any data.

:::warning Note
It's critical to note that all interactions between contracts are asynchronous. The blockchain guarantees that a sent internal message will be delivered, strictly in one copy, and if a contract A sends multiple messages to contract B, they will be delivered strictly in the order of sending. However, there are no guarantees regarding the timing of delivery. The blockchain does not guarantee the delivery of external messages.
:::

## External Outbound Messages

External outbound messages are events that contracts emit for the outside world. While they typically contain a source address, they do not necessarily have a destination address, nor do they carry any value. Despite this, the destination field can still be specified in these messages. However, it's important to note that even if a destination is provided, the message won't be sent to that address within the blockchain. The inclusion of this field can be useful for off-chain indexing purposes. These messages are critical for implementing off-chain logic. You can subscribe to these messages and perform off-chain actions whenever you receive them.

Each message, regardless of its type, can contain a body which is an arbitrary cell. This cell is used for function input/output or event data.

:::tip Note
All functions can be executed either via external or internal messages. However, the way they handle return values differs based on whether a function is marked as `responsible` or not. The `responsible` modifier is a feature that helps manage return values when functions are invoked. It doesn't cause the function to return a value directly. Instead, it automatically generates a callback that invokes the specified function with the return arguments.
:::

## Non-bounceable Messages

Most internal messages sent between smart contracts should be bounceable, i.e., should have their "bounce" bit set. Then, if the destination smart contract does not exist, or if it throws an unhandled exception while processing this message, the message will be "bounced" back carrying the remainder of the original value (minus all message transfer and gas fees). However, on some occasions, non-bounceable internal messages must be used. For instance, new accounts cannot be created without at least one non-bounceable internal message being sent to them.

:::info Note
The query contained in the body of a bounced message should never be executed.
:::

:::tip Note
It is a good idea not to allow the end user (e.g., of a wallet) to send unbounceable messages containing large amounts of value or to warn them if they do. It is a better idea to send a small amount first, then initialize the new smart contract, and then send a larger amount.
:::
