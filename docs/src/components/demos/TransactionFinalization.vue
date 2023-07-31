<template>
  <div class="demo">
    <button @click="setOtherState()">Call Contract A</button>
    <div v-if="prevState1">
      <pre>prevState_A: {{ prevState1 }}</pre>
      <pre>prevState_B: {{ prevState2 }}</pre>
    </div>
    <div v-if="transaction">
      <pre>newState_A: {{ newState1 }}</pre>
      <pre>newState_B: {{ newState2 }}</pre>
      <pre>Transaction: {{ transaction }}</pre>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref } from 'vue';
import { Address, ProviderRpcClient } from 'everscale-inpage-provider';
import { testContract, toast, toNano } from './../../helpers';
import { useProvider } from '../../providers/useProvider';
const { provider } = useProvider();

export default defineComponent({
  name: 'IncreaseStateComponent',
  setup() {
    const prevState1 = ref('');
    const prevState2 = ref('');
    const newState1 = ref('');
    const newState2 = ref('');
    const transaction = ref('');

    async function fetchStates(state_1: Ref<string>, state_2: Ref<string>) {
      const exampleContract_1 = new provider.Contract(
        testContract.ABI,
        new Address(testContract.address)
      );
      const exampleContract_2 = new provider.Contract(
        testContract.ABI,
        new Address(testContract.dublicateAddress)
      );

      const { _state: newState_1 } = await exampleContract_1.methods.getDetails().call();
      const { _state: newState_2 } = await exampleContract_2.methods.getDetails().call();

      state_1.value = newState_1;
      state_2.value = newState_2;
    }

    async function setOtherState() {
      try {
        await provider.ensureInitialized();
        const { accountInteraction } = await provider.requestPermissions({
          permissions: ['basic', 'accountInteraction'],
        });

        const exampleContract_1 = new provider.Contract(
          testContract.ABI,
          new Address(testContract.address)
        );

        const senderAddress = accountInteraction?.address!;

        await fetchStates(prevState1, prevState2);

        const { _state: prevState_1 } = await exampleContract_1.methods.getDetails().call();

        const payload = {
          abi: JSON.stringify(testContract.ABI),
          method: 'setOtherState',
          params: {
            other: new Address(testContract.dublicateAddress),
            _state: Number(prevState_1) + 1,
            count: 256,
          },
        };
        const { transaction: tx } = await provider.sendMessageDelayed({
          sender: senderAddress,
          recipient: new Address(testContract.address),
          amount: toNano(0.3),
          bounce: true,
          payload: payload,
        });

        toast('Transaction sent', 0);

        const subscriber = new provider.Subscriber();
        const traceStream = subscriber.trace(await tx);

        traceStream.on(async data => {
          if (data.aborted) {
            traceStream.stopProducer();
            await fetchStates(newState1, newState2);
            transaction.value = JSON.stringify(data, null, 2);
          }
        });
      } catch (err: any) {
        if (err.message.includes('"exitCode": -14,')) {
          transaction.value = err.message || 'Unknown Error';
        } else {
          toast(err.message, 0);
        }
      }
    }

    return {
      prevState1,
      prevState2,
      newState1,
      newState2,
      transaction,
      setOtherState,
    };
  },
});
</script>
