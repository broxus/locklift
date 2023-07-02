<template>
  <div>
    <div v-if="parsedState" class="contract-state">Simple State: {{ parsedState.simpleState }}</div>
    <div>
      <label for="someParam">SomeParam:</label>
      <input id="someParam" v-model="someParam" type="number" />
    </div>
    <button @click="sendMessage">Send Message</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'BDKContractInfo',
  props: {
    contractState: {
      type: String,
      default: '',
    },
    onSendMessage: {
      type: Function,
      default: undefined,
    },
  },
  setup(props) {
    const someParam = ref(0);

    function sendMessage() {
      if (props.onSendMessage) {
        props.onSendMessage(someParam.value);
      }
    }

    return { someParam, sendMessage };
  },
  computed: {
    parsedState() {
      try {
        return JSON.parse(this.contractState);
      } catch (error) {
        return null;
      }
    },
  },
});
</script>
