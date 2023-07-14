# Overview

Locklift, inspired by [Truffle](https://trufflesuite.com) and [Hardhat](https://hardhat.org), is a Node JS framework designed to facilitate the building, testing, running, and maintaining of smart contracts for TVM (Threaded Virtual Machine) blockchains like Everscale, Venom, Gosh and TON.

![locklift logo](https://user-images.githubusercontent.com/15921290/183642554-6372baf5-bac5-4477-888b-870a6993f666.png)

<p align="center">
    <p align="center">Development environment for TVM-compatible blockchains.</p>
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

With Locklift, developers can benefit from:

- Network management capabilities for various networks (main, test, local, etc.)
- Automated contract testing with Mocha
- A useful wrapper for smart contracts
- Support for custom givers
- Management of keys
- An external script runner to execute scripts within a given environment

Locklift primarily revolves around command execution and extensibility through plugins, allowing for the creation of complex workflows. The `Locklift` class in the provided code snippet is responsible for setting up and initializing the development environment. It includes setting up the network connection, key management, creating the factory for deploying contracts, and establishing tracing for contract interactions. The class also provides utility methods and handles errors related to connection and network setup.

::: tip
Locklift interfaces with the blockchain using the [`everscale-inpage-provider`](https://github.com/broxus/everscale-inpage-provider) and [`everscale-standalone-client`](https://github.com/broxus/everscale-standalone-client).
The inpage provider is a powerful tool for building web3 applications that operate with TVM-compatible blockchains. It helps developers build statically type checked contract interactions, pack/unpack complex cell data structures, and write elegant transaction parsers using streams and combinators. When no providers are installed, or in a NodeJS environment, the standalone client can be utilized, which supports methods not requiring user interaction. For a deeper understanding of the inpage provider, you can refer to the
[`Inpage Provider Documentation`](https://docs.broxus.com/).
:::
