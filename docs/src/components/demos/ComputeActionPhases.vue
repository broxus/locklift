<template>
  <div class="demo">
    <button @click="increaseState(0)">Call Contract</button>
    <button @click="increaseState(1)">Call with Gas Failure</button>
    <button @click="increaseState(2)">Failure with 256 actions</button>
    <pre class="event-data" v-if="eventData">{{ eventData }}</pre>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, ref } from 'vue';
import { Address } from 'everscale-inpage-provider';
import { testContract, toNano } from './../../helpers';
import { toast } from '../../helpers/toast';

import { useProvider } from '../../providers/useProvider';
const { provider } = useProvider();

enum TypeAction {
  Success = 0,
  GasFailure = 1,
  ActionPhaseFailure256 = 2,
}

export default defineComponent({
  name: 'IncreaseStateComponent',
  setup() {
    const eventData = ref();

    const testAddress: Address = inject('testAddress')!;
    const dublicateTestAddress: Address = inject('dublicateTestAddress')!;

    return { eventData, testAddress, dublicateTestAddress };
  },
  methods: {
    async increaseState(type: TypeAction) {
      await provider.ensureInitialized();
      const { accountInteraction } = await provider.requestPermissions({
        permissions: ['basic', 'accountInteraction'],
      });
      const exampleContract = new provider.Contract(
        testContract.ABI,
        new Address(testContract.getAddress())
      );
      const senderAddress = accountInteraction?.address!;
      const subscriber = new provider.Subscriber();
      const contractEvents = exampleContract.events(subscriber);
      const eventCallback = (event: any) => {
        this.eventData = JSON.stringify(event, null, 2);
        contractEvents.stopProducer();
      };
      contractEvents.on(eventCallback);
      if (type === TypeAction.Success) {
        const payload = {
          abi: JSON.stringify(testContract.ABI),
          method: 'increaseState',
          params: {
            count: 253,
          },
        };
        await provider.sendMessageDelayed({
          sender: senderAddress,
          recipient: this.testAddress,
          amount: toNano(1),
          bounce: true,
          payload: payload,
        });
        toast('Transaction Sent', 1);
      } else if (type === TypeAction.GasFailure) {
        const payload = {
          abi: JSON.stringify(testContract.ABI),
          method: 'increaseState',
          params: {
            count: 253,
          },
        };
        const { transaction: tx } = await provider.sendMessageDelayed({
          sender: senderAddress,
          recipient: this.testAddress,
          amount: toNano(0.001),
          bounce: true,
          payload: payload,
        });
        toast('Transaction Sent', 1);
        const traceStream = subscriber.trace(await tx);
        traceStream.on(data => {
          this.eventData = JSON.stringify(data, null, 2);
          traceStream.stopProducer();
        });
      } else if (type === TypeAction.ActionPhaseFailure256) {
        const payload = {
          abi: JSON.stringify(testContract.ABI),
          method: 'increaseState',
          params: {
            count: 254,
          },
        };
        const { transaction: tx } = await provider.sendMessageDelayed({
          sender: senderAddress,
          recipient: this.testAddress,
          amount: toNano(1),
          bounce: true,
          payload: payload,
        });
        toast('Transaction Sent', 1);
        const traceStream = subscriber.trace(await tx);
        traceStream.on(data => {
          this.eventData = JSON.stringify(data, null, 2);
          traceStream.stopProducer();
        });
      }
    },
  },
});
</script>
