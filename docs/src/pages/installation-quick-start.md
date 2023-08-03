---
outline: deep
---

# Installation & Quick Start

## Installation

Locklift is typically used through a local installation in your project, which ensures reproducibility and prevents future version conflicts.

To install Locklift, you need Node.js 14 or later. First, initialize an npm project by navigating to an empty folder and running:

```bash
npm init
```

Follow the prompts to create your new project.

Once your project is initialized, you can install Locklift with the following command:

```bash
npm install --save-dev locklift
```

With Locklift installed, you can now utilize its functionalities for your smart contract development.

## Quick Start

We will explore the basics of creating a Locklift project with a sample contract, tests of that contract, and a script to deploy it.

To create the sample project, run `npx locklift init` in your project folder:

```bash
# initialize in the current directory
npx locklift init -f
# or specify a new one
npx locklift init --path amazing-locklift-project
```

:::tip
If you run `npx locklift init -f` after `npm init`, it will overwrite the existing files, including `package.json`. This process might not be ideal as it's still a bit raw. If you want to avoid this, you can run `npx locklift init` without the prior installation of Locklift. `npx` will automatically fetch Locklift and create a sample project. This is a handy workaround that doesn't contradict the steps mentioned above.
:::

### Building the Contract

Next, if you take a look in the `contracts/` folder, you'll see Sample.tsol:

```solidity
pragma ever-solidity >= 0.61.2;
pragma AbiHeader expire;
pragma AbiHeader pubkey;


contract Sample {
    uint16 static _nonce;

    uint state;

    event StateChange(uint _state);

    constructor(uint _state) public {
        tvm.accept();

        setState(_state);
    }

    function setState(uint _state) public {
        tvm.accept();
        state = _state;

        emit StateChange(_state);
    }

    function getDetails()
        external
        view
    returns (
        uint _state
    ) {
        return state;
    }
}

```

Let's build the contract using the command below:

```bash
npx locklift build
```

This command will use the specified TON Solidity compiler and TVM linker to build all contracts in the `contracts/` directory. The built files will be placed in `build/`.

```
[INFO]  Found 1 sources
[INFO]  factorySource generated
[INFO]  Built
```

### Sandbox

Before running tests in a local environment, make sure to first start the local node (sandbox).

```bash
everdev se start
```

or

```bash
docker run -d --name local-node -e USER_AGREEMENT=yes -p80:80 tonlabs/local-node
```

For more details on how to do this, refer to the [Everdev](https://github.com/tonlabs/everdev).

### Testing the Contract

Testing the contract verifies its functions under specified conditions. We'll be utilizing [Mocha](https://mochajs.org/) for this purpose. Here's the command to execute the tests:

```bash
npx locklift test --network local
```

This command will automatically run the Mocha tests located in the `test` directory. The `locklift` object will be automatically configured and integrated, eliminating the need for manual import.

```
Test Sample contract
  Contracts
    ✅ Load contract factory
    ✅ Deploy contract (1511ms)
    ✅ Interact with contract (611ms)

3 passing (2s)
```

In your `test/` folder, you will find a test file like the following one:

```typescript
import { expect } from 'chai';
import { Contract, Signer } from 'locklift';
import { FactorySource } from '../build/factorySource';

let sample: Contract<FactorySource['Sample']>;
let signer: Signer;

describe('Test Sample contract', async function () {
  before(async () => {
    signer = (await locklift.keystore.getSigner('0'))!;
  });
  describe('Contracts', async function () {
    it('Load contract factory', async function () {
      const sampleData = await locklift.factory.getContractArtifacts(
        'Sample'
      );

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
      sample = contract;

      expect(
        await locklift.provider
          .getBalance(sample.address)
          .then(balance => Number(balance))
      ).to.be.above(0);
    });

    it('Interact with contract', async function () {
      const NEW_STATE = 1;

      await sample.methods
        .setState({ _state: NEW_STATE })
        .sendExternal({ publicKey: signer.publicKey });

      const response = await sample.methods.getDetails({}).call();

      expect(Number(response._state)).to.be.equal(
        NEW_STATE,
        'Wrong state'
      );
    });
  });
});
```

This sample test file comprises three major stages:

1. **Loading the contract factory**: This phase validates the existence of the contract code, ABI (Application Binary Interface), and the tvc (TVM binary code).

2. **Deploying the contract**: Here, the contract is deployed with an initial state and funded with 2 coins converted to nanocoins. The test then asserts that the balance of the contract's address is more than 0, ensuring successful deployment.

3. **Interacting with the contract**: In this phase, the state of the contract is altered, and the test verifies if the state change was successful.

These tests offer a practical way to ensure the contract behaves as expected before deploying it to the live network.

### Deploying the Contract

Once we have built and tested our contract, we can deploy it using a Node JS script. The command to do this is:

```bash
npx locklift run --network local --script scripts/1-deploy-sample.ts
```

This command will run the specified script with an already configured `locklift` module. In the example above, we are deploying the `Sample.tsol` contract.

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

```
Sample deployed at: 0:a56a1882231c9d901a1576ec2187575b01d1e33dd71108525b205784a41ae6d0
```

:::tip
In essence, the deployment process is divided into two parts - funding from the giver, and then the actual deployment of the code. We will delve deeper into this process further in the [Deploying Contracts](./guides/deploying-contracts.md).
:::
