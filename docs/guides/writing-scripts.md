---
title: Writing Scripts
outline: deep
---

# Writing Scripts

This guide provides a comprehensive overview of creating, executing, and managing scripts using Locklift.

Locklift scripts are independent TypeScript or JavaScript files that run within the Locklift environment. They're designed to perform a variety of tasks, including smart contract deployment, interaction, and event handling. The preconfigured `locklift` module significantly streamlines the development process.

While both TypeScript and JavaScript can be used, TypeScript is recommended. It provides better autocompletion and can catch potential errors earlier. However, if you prefer JavaScript, you can certainly use it for your scripts.

## Run Scripts

Locklift scripts can be executed using the `run` command:

```bash
npx locklift run --network local --script scripts/1-deploy-sample.ts
```

This command runs the `1-deploy-sample.ts` script within the local Locklift environment.

## Writing a Script

A Locklift script typically includes the deployment and interaction with a contract. Here's a sample script that demonstrates these processes:

```typescript
async function main() {
  const signer = (await locklift.keystore.getSigner('0'))!;
  const { contract: sample, tx } =
    await locklift.factory.deployContract({
      contract: 'Sample',
      publicKey: signer.publicKey,
      initParams: {
        _nonce: locklift.utils.getRandomNonce(),
      },
      constructorParams: {
        _state: 0,
      },
      value: locklift.utils.toNano(3),
    });

  console.log(`Sample deployed at: ${sample.address.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
```

This script performs the following tasks:

1. **Get a signer:** Retrieves the signer object associated with the public key '0' using `locklift.keystore.getSigner('0')` function.

2. **Deploy contract:** It launches a new instance of the `Sample` contract on the network using the `locklift.factory.deployContract({...})` method. The deployment includes providing the contract name, public key, initial parameters, constructor parameters, and value.

3. **Print contract address:** Once the contract is successfully deployed, it logs the contract's address using `sample.address.toString()`.

Please note that this script does not contain code for interacting with the contract, catching and inspecting events, or catching calls, as described in the original script description.

:::tip
Here are some useful resources that can assist you when creating scripts with Locklift:

- **Understanding Locklift Environment:** Scripts execute within the Locklift environment. Familiarize yourself with the specifics of this environment and its configuration by checking out the [`Setting Up a Project`](./setting-up-a-project.md) guide.

- **Async Transactions:** TVM-compatible blockchains operate based on a pure actor model, where each contract acts as an independent actor, processing its own messages. The execution of a smart contract or transaction is a sequence of actions that can happen asynchronously. For a deeper understanding, refer to the [`Actor Model & Async Transactions`](./concepts/transaction-finalization.md#actor-model--async-transactions) section in the core concepts guide.
- **Error Handling and Debugging:** Implement error catching and handling in your scripts to prevent unnecessary crashes and to provide valuable debug information. The [`Debugging & Testing Contracts`](./debug-test-contracts.md) guide will be instrumental in learning how to trace and debug scripts, handle errors, and manage time in tests.

In addition to these resources, you can also refer to the [`Deploying Contracts`](./deploying-contracts.md) guide to learn about the Contract Factory, retrieving contract artifacts, deploying contracts, and managing wallets and accounts.

:::
