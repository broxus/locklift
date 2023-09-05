# Locklift Networks

Locklift comes bundled with a built-in network called Proxy, a local TVM network node designed for development. It allows you to deploy your contracts, run your tests, and debug your code, all within the confines of your local machine.

## How does it work?

The Proxy network operates as an in-memory process, which means that it runs within the same process space as your Locklift application. This design decision allows for more direct and efficient communication between Locklift and the Proxy network.

Unlike traditional blockchain networks, Proxy does not rely on JSON-RPC for client-server communication. Instead, Locklift intercepts client requests directly, eliminating the need for external network protocols.

In terms of block production, Proxy does not mine blocks in the conventional sense. Instead, it utilizes a simplified imitation of the block production process. This method effectively addresses the needs of the majority of development scenarios while significantly improving efficiency.

The Proxy network is underpinned by the TVM implementation, which ensures a robust and efficient environment for running and testing smart contracts.

## How can I use it?

By default, if you're using Locklift, then you're already using the Proxy network.

When Locklift executes your tests, scripts, or tasks, an in-process Proxy network node is started automatically. All of Locklift's plugins will connect directly to this node's provider.

There's no need to make any changes to your tests or scripts.

Proxy is simply another network. If you wanted to be explicit, you could run, for example, `npx locklift test -n proxy`.

## Why would I want to use Proxy?

Choosing to use Proxy over a traditional local node offers a range of benefits and enhancements:

### Speed

Depending on your system, you could experience up to 20 times speed increase. This performance boost can significantly expedite your development process, allowing you to iterate and test your smart contracts more efficiently.

### Fixtures (Coming Soon)

Proxy will support fixtures, predefined pieces of data that set up your system for testing. This feature will simplify and streamline the process of setting up complex test scenarios.

### Snapshots and Reversions (Coming Soon)

Proxy will allow you to take snapshots of your blockchain's state and revert back to them. This feature is helpful when you want to revert your test environment back to a known state.

### Fork Network Testing (Coming Soon)

Proxy will enable you to run tests on a fork of a network. This feature will be useful when you want to test how your contracts would behave on a live network without the risk of deploying them.

### High Resilience

Proxy is designed to handle a high volume of transactions and operations without crashing or slowing down, making it a reliable choice for heavy-duty development and testing.

### Breakpoints (Coming Soon)

Proxy will support breakpoints, allowing you to pause execution of your contracts at specific points. This feature will be useful for debugging and understanding how your contracts behave.

### Pre-deployed Accounts (Coming Soon)

Similar to the Hardhat network, Proxy will offer pre-deployed accounts with large balances. This will allow you to test transactions that require significant amounts of funds without the need to acquire them.

These features make Proxy a powerful tool for developing and testing smart contracts on the TVM blockchain. Whether you're a seasoned blockchain developer or just getting started, Proxy can help streamline your workflow and make the process of building and testing smart contracts more efficient and enjoyable.
