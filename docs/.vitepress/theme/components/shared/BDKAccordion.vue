<template>
  <div class="demo accordion">
    <button class="" @click="toggleAccordion">
      {{ buttonText }}
    </button>
    <div v-show="isOpen" class="">
      <pre>{{ transactionData }}</pre>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'AccordionElement',
  props: {
    buttonText: {
      type: String,
      default: 'Show transaction',
    },
    transactionData: {
      type: String,
      default: '',
    },
  },
  setup() {
    const isOpen = ref(false);

    function toggleAccordion() {
      isOpen.value = !isOpen.value;
    }

    return { isOpen, toggleAccordion };
  },
});
</script>

<style scoped>
.accordion {
  padding: 0;
  margin: 1rem 0 !important;
}
</style>
