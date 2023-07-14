---
title: Internal & External Messages
outline: deep
---

# Concept of Internal & External Messages

In Threaded Virtual Machine (TVM) blockchains, messages are integral to facilitating interactions between smart contracts or between smart contracts and external applications. Messages essentially serve as the main communication medium, enabling contracts to execute various operations. Messages are categorized into three types:

- External Inbound Messages
- Internal Messages
- External Outbound Messages

## External Inbound Messages

External inbound messages are used to deploy and call contracts from outside the blockchain. They lack a source address but possess a destination address, and they do not carry any value. These messages are subject to size limitations, and their delivery is not guaranteed to be in order or even guaranteed at all.

External inbound messages can initiate a chain of messages. Validators allocate these messages a gas credit of 10k, attempting to execute a transaction, invoking the contract and passing on the message. The contract must agree to pay for the transaction from its account within the 10k gas credit limit, using the `tvm.accept()` method. If the method is invoked, the transaction continues, and the contract can create additional outbound messages. If an exception occurs, or the contract does not invoke `tvm.accept()`, or the gas credit runs out, the message is discarded and does not enter the blockchain.

:::danger Note
All external messages must be protected against replay attacks. The simplest way to protect smart contracts from replay attacks related to external messages is to store a 32-bit counter `cur-seqno` in the persistent data of the smart contract, and to expect a `req-seqno` value in (the signed part of) any inbound external messages. Then an external message is accepted only if both the signature is valid and `req-seqno` equals `cur-seqno`. After successful processing, the `cur-seqno` value in the persistent data is increased by one, so the same external message will never be accepted again.
:::

## Internal Messages

Internal messages facilitate communication between smart contracts within the blockchain. They contain both a source and a destination address and can carry value. They enable contracts to interact with each other and perform operations like invoking methods and transferring value.

Each internal message is unique, containing its full source address along with its logical creation time. Outbound messages created by the same smart contract have strictly increasing logical creation times, enabling you to find a message by its hash. The order of internal messages is preserved by their logical time, and their delivery is guaranteed.

The `dest.transfer(value)` function creates an internal message with a value in Native Coins, which invokes the `receive()` function in the receiving contract without any data.

:::warning Note
It's critical to note that all interactions between contracts are asynchronous. The blockchain guarantees that a sent internal message will be delivered, strictly in one copy, and if a contract A sends multiple messages to contract B, they will be delivered strictly in the order of sending. However, there are no guarantees regarding the timing of delivery. The blockchain does not guarantee the delivery of external messages.
:::

## External Outbound Messages

External outbound messages are events that contracts produce for the outside world. They contain a source address but do not have a destination address and do not carry any value. These messages are essential for implementing off-chain logic. You can subscribe to these messages and perform off-chain actions whenever you receive them.

Each message, regardless of its type, can contain a body which is an arbitrary cell. This cell is used for function input/output or event data.

:::tip Note
All functions can be executed either via external or internal messages. However, if a function is not marked as `responsible`, it will not return anything when called via an internal message.
:::

## Message Size and Structure

Each cell in a message can contain up to 1023 bits. If more data needs to be stored, it should be split into chunks and stored in reference cells. The message body typically begins with a 32-bit `op` field, identifying the operation to be performed or the method of the smart contract to be invoked, and a 64-bit `query_id` field, used in all query-response internal messages. The remainder of the message body is specific for each supported value of `op`.

For instance, a "simple transfer message with comment" has a comment contained in the remainder of the message body (without any `query_id` field, i.e., starting from the fifth byte). If the comment does not begin with the byte 0xff, the comment is a text one; it can be displayed "as is" to the end user of a wallet (after filtering out invalid and control characters and checking that it is a valid UTF-8 string).

## Non-bounceable Messages

Most internal messages sent between smart contracts should be bounceable, i.e., should have their "bounce" bit set. Then, if the destination smart contract does not exist, or if it throws an unhandled exception while processing this message, the message will be "bounced" back carrying the remainder of the original value (minus all message transfer and gas fees). However, on some occasions, non-bounceable internal messages must be used. For instance, new accounts cannot be created without at least one non-bounceable internal message being sent to them.

:::info Note
The query contained in the body of a bounced message should never be executed.
:::

:::tip Note
It is a good idea not to allow the end user (e.g., of a wallet) to send unbounceable messages containing large amounts of value or to warn them if they do. It is a better idea to send a small amount first, then initialize the new smart contract, and then send a larger amount.
:::
