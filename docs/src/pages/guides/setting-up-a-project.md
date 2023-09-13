---
outline: deep
---

# Setting Up A Project

This section provides a step-by-step guide to setting up a new project using Locklift, a Node JS framework for building, testing, running, and maintaining smart contracts for TVM-compatible blockchains like Everscale and Venom.

## Introduction

Setting up a new project involves initializing the project, installing necessary dependencies, configuring the Locklift environment, and understanding the Locklift Command Line Interface (CLI). This section will guide you through these steps.

## Locklift CLI Overview

Locklift provides a Command Line Interface (CLI) that allows you to execute various commands for managing your project. The CLI is an essential tool for developers to initialize a new project, build contracts, run tests, and execute scripts.

To check the version of your Locklift installation, use the following command:

```bash
npx locklift --version
```

## Project Initialization

Locklift is typically utilized through a local installation in your project. This ensures reproducibility and prevents future version conflicts.

If you're starting a new project, you can simplify the process by running:

```bash
// Create a new directory
mkdir myProject
cd myProject
// initialize in current directory
npx locklift init -f
// or specify new one
npx locklift init --path amazing-locklift-project
```

This will create your project directory, install Locklift, and initialize your project.

If your project already exists, you can install Locklift using:

```bash
npm install --save-dev locklift
```

## Project Configuration

After initializing your project, the next step is to configure your Locklift environment. This involves creating and setting up the `locklift.config.ts` file, which is crucial for defining how your project will interact with different networks.

The configuration file allows you to specify settings such as the network connections, giver settings, key management, and more. While a detailed explanation of each configuration option is outside the scope of this section, you can refer to the dedicated [Configuration](./../configuration.md) section for a deeper understanding.

## Building Contracts

Locklift provides a `build` command to compile all project contracts using the specified TON Solidity compiler and TVM linker:

```bash
npx locklift build
```

## Running Tests

The introduction of the [Locklift network](./../locklift-network/overview.md) has significantly streamlined the testing process. When using Locklift to run tests, the framework automatically selects the Locklift network as the default environment. This eliminates the need to specify a network manually or initiate a local sandbox each time, simplifying the overall testing procedure and saving valuable time.

You can run Mocha tests for your project contracts using the `test` command.

```bash
npx locklift test
```

Alternatively, you can use the `npm run test` command if you have added the following to your `package.json` file:

```json
"scripts": {
  "test": "npx locklift test"
}
```

Then, run your tests:

```bash
npm run test
```

```
  Test Sample contract
    Contracts
      ✓ Load contract factory
      ✓ Deploy contract (1491ms)
      ✓ Interact with contract (1110ms)


  3 passing (3s)
```

### Local Node Sandbox (Optional)

Locklift network is used by default, if you prefer to use your own local node for testing, you can still do so. Make sure to first start the local node (sandbox).

```bash
everdev se start
```

or

```bash
docker run -d --name local-node -e USER_AGREEMENT=yes -p80:80 tonlabs/local-node
```

:::info
For more details on how to do this, refer to the [Everdev](https://github.com/tonlabs/everdev).
:::

Then, you can specify the local network in the test command:

```bash
npx locklift test --network local
```

or in your `package.json` file:

```json
"scripts": {
  "test": "npx locklift test --network local"
}
```

### Running Tests in Different Networks

While it's possible to run tests in different networks by using the network flag followed by the network name, we generally recommend doing this primarily when you are conducting integration tests or testing interactions with contracts in specific networks. Here's how you can specify a network:

```bash
npx locklift test --network <network_name>
```

## Running Scripts

Locklift enables you to run arbitrary Node JS scripts with an already configured `locklift` module using the `run` command:

```bash
npx locklift run --script scripts/1-deploy-sample.ts
```

Alternatively, you can specify a network with the following command:

```bash
npx locklift run --network venom-testnet --script scripts/1-deploy-sample.ts
```

:::tip
For a more detailed guide on writing scripts, please refer to the [Writing Scripts](./writing-scripts.md).
:::

## Setting Up Your Editor

For an enhanced development experience, you can leverage code editors that support Node.js development, such as Visual Studio Code or JetBrains WebStorm. These editors offer features like syntax highlighting, linting, and auto-completion that can significantly speed up your development process.

For Visual Studio Code, we recommend the [Everscale Solidity support](https://marketplace.visualstudio.com/items?itemName=everscale.solidity-support) extension, which provides syntax highlighting, snippets, error checking, and other useful features for Everscale blockchain development.

For JetBrains IDEs, consider using the [T-Sol (Threaded Solidity) plugin](https://github.com/broxus/intellij-t-sol). T-Sol enhances the coding experience by providing features like syntax highlighting, code completion, file templates, goto declaration, find usages, and code formatting.

## Plugins and Dependencies

Locklift's functionality can be extended through plugins. Plugins are Node.js modules that provide additional features or integrate with external services. To use a plugin, you need to install it as a dependency and then require it in your Locklift project.

Locklift does have official plugins that can be used to extend its functionality:

1. [locklift-verify](https://github.com/broxus/locklift-verifier)
2. [locklift-deploy](https://github.com/broxus/locklift-deploy)
3. [locklift-plugin-boilerplate(example of implementation)](https://github.com/broxus/locklift-plugin-boilerplate)

If you're interested in creating your own plugins, you can refer to our comprehensive [guide on plugin development]#TODO:add link on guide.
