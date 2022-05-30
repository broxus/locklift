const getRandomNonce = () => Math.random() * 64000 | 0;


async function main() {
  const Sample = await locklift.factory.getContract('Sample');
  const [keyPair] = await locklift.keys.getKeyPairs();
  
  const sample = await locklift.giver.deployContract({
    contract: Sample,
    constructorParams: {
      _state: 123
    },
    initParams: {
      _nonce: getRandomNonce(),
    },
    keyPair,
  });
  
  console.log(`Sample deployed at: ${sample.address}`);
}


main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
