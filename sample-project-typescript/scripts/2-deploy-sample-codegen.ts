import SampleCodegen from '../codegen/Sample';

const getRandomNonce = () => Math.random() * 64000 | 0;


async function main() {
  const Sample = await locklift.factory.initializeCodegenContract<SampleCodegen>(SampleCodegen);
  const [keyPair] = await locklift.keys.getKeyPairs();

  Sample.setKeyPair(keyPair);

  await Sample.deploy({
    initParams: { _nonce: getRandomNonce() },
    constructorParams: { _state: 123 },
  });

  console.log(`Sample deployed at: ${Sample.address}`);
}


main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
