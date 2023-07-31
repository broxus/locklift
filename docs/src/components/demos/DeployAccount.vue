<template>
  <div class="demo">
    <button @click="deployAccount">Deploy</button>
    <a
      v-if="deployedContract"
      :href="`https://net.ever.live/accounts/accountDetails?id=${deployedContract}`"
      target="_blank"
      >{{ deployedContract }}</a
    >
  </div>
</template>

<script lang="ts">
import { GetExpectedAddressParams, Contract } from 'everscale-inpage-provider';
import { defineComponent, ref } from 'vue';

import { toNano, testContract, errorExtractor } from './../../helpers/';
import { useProvider } from './../../providers/useProvider';

type DeployParams<Abi> = GetExpectedAddressParams<Abi> & {
  publicKey: string | undefined;
};

export default defineComponent({
  name: 'DeployAccount',
  setup() {
    const deployedContract = ref('');
    const tx = ref('');

    const exampleAbi = testContract.ABI;

    return { deployedContract, tx, exampleAbi };
  },
  methods: {
    async deployAccount() {
      // const provider = new ProviderRpcClient({
      //   fallback: () =>
      //     EverscaleStandaloneClient.create({
      //       connection: {
      //         id: 1000,
      //         group: 'venom_testnet',
      //         type: 'jrpc',
      //         data: {
      //           endpoint: 'https://jrpc-testnet.venom.foundation/rpc',
      //         },
      //       },
      //     }),
      //   forceUseFallback: true,
      // });
      const { provider } = useProvider();
      await provider.ensureInitialized();

      // Request permissions from the user to execute API methods using the provider.
      await provider.requestPermissions({ permissions: ['basic', 'accountInteraction'] });

      const providerState = await provider.getProviderState();

      const senderPublicKey = providerState?.permissions.accountInteraction?.publicKey!;
      const senderAddress = providerState?.permissions.accountInteraction?.address!;

      const deployParams: DeployParams<typeof testContract.ABI> = {
        tvc: testContract.base64,
        workchain: 0,
        publicKey: senderPublicKey,
        initParams: {
          _nonce: (Math.random() * 64000).toFixed(),
        },
      };

      const expectedAddress = await provider.getExpectedAddress(testContract.ABI, deployParams);
      console.log('expectedAddress', expectedAddress);
      const stateInit = await provider.getStateInit(testContract.ABI, deployParams);

      // const constructorPayload = {
      //   abi: JSON.stringify(ABI),
      //   method: 'constructor',
      //   params: {
      //     someParam: someParam.toString(),
      //     second: secondParam,
      //   },
      // };

      await errorExtractor(
        provider.sendMessage({
          sender: senderAddress,
          recipient: expectedAddress,
          amount: toNano(1),
          bounce: false,
          stateInit: stateInit.stateInit,
          //payload: constructorPayload,
        })
      );

      const exampleContract: Contract<typeof testContract.ABI> = new provider.Contract(
        testContract.ABI,
        expectedAddress
      );

      await errorExtractor(
        exampleContract.methods.constructor({ _state: 0 }).sendExternal({
          stateInit: stateInit.stateInit,
          publicKey: deployParams.publicKey!,
        })
      );

      this.deployedContract = expectedAddress.toString();
    },
  },
});
</script>
