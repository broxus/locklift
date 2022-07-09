const getRandomNonce = () => (Math.random() * 64000) | 0;
async function main() {
  const [keyPair] = await locklift.keys.getKeyPairs();

  const Sample = await locklift.factory.getContract("Sample");

  const sample = await locklift.giver.deployContract({
    contract: Sample,
    constructorParams: {
      _state: 123,
    },
    initParams: {
      _nonce: getRandomNonce(),
    },
    keyPair,
  });
  console.log(`Sample deployed at: ${sample.address}`);

  let wallet;
  try {
    wallet = await locklift.utils.deployAccount({
      keyNumber: 0,
      balance: 100,
    });
  } catch (err) {
    wallet = await this.locklift.factory.getAccount("Wallet");
    const { address } = await this.locklift.ton.createDeployMessage({
      contract: wallet,
      constructorParams: {},
      initParams: {
        _randomNonce: getRandomNonce(),
      },
      keyPair: keyPair,
    });
    wallet.address = address;
  }

  try {
    const tx = await wallet.runTarget({
      contract: sample,
      method: "setState",
      params: { _state: 111 },
      keyPair: keyPair,
    });
    console.log(tx);

    return tx;
  } catch (err) {
    console.log(err);
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
