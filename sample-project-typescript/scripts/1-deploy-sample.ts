import { Dimensions } from "locklift";

async function main() {
  const signer = (await locklift.provider.keyStore.getSigner("0"))!;
  const { contract: sample, tx } = await locklift.factory.deployContract(
    "Sample",
    {
      initParams: {
        _nonce: locklift.utils.getRandomNonce(),
      },
      publicKey: signer.publicKey,
    },
    {
      _state: 0,
    },
    locklift.utils.convertCrystal(3, Dimensions.Nano),
  );

  console.log(`Sample deployed at: ${sample.address.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
