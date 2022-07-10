import { expect } from 'chai';
import SampleCodegen from '../codegen/Sample';


let Sample: SampleCodegen;

const getRandomNonce = () => Math.random() * 64000 | 0;


describe('Test Sample contract', async function() {
  describe('Contracts', async function() {
    it('Load contract factory', async function() {
      Sample = await locklift.factory.initializeCodegenContract<SampleCodegen>(SampleCodegen);

      expect(Sample.code).not.to.equal(undefined, 'Code should be available');
      expect(Sample.abi).not.to.equal(undefined, 'ABI should be available');
    });

    it('Deploy contract', async function() {
      this.timeout(20000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      Sample.setKeyPair(keyPair);

      await Sample.deploy({
        initParams: { _nonce: getRandomNonce() },
        constructorParams: { _state: 123 },
      });

      expect(Sample.address).to.be.a('string')
        .and.satisfy((s: string) => s.startsWith('0:'), 'Bad future address');
    });

    it('Interact with contract', async function() {
      await Sample.methods.setState.run({ _state: 111 });

      const response = await Sample.methods.getDetails.call();

      expect(response.toNumber()).to.be.equal(111, 'Wrong state');
    });
  });
});
