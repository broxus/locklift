<template>
  <div class="input-domain" contenteditable="true" data-post-fix=".ever" @input="updateValue">
    {{ value }}
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, toRefs, PropType } from 'vue';

export default defineComponent({
  name: 'BDKEditableInput',
  props: {
    modelValue: {
      type: String as PropType<string>,
      default: '',
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { modelValue } = toRefs(props);

    const value = ref(modelValue.value);

    watch(modelValue, newValue => {
      value.value = newValue;
    });

    const updateValue = (event: Event) => {
      const target = event.target as HTMLInputElement;
      emit('update:modelValue', target.textContent || '');
    };

    return { value, updateValue };
  },
});
</script>

<style scoped>
.input-domain {
  padding-right: 0px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 0.2em 0.6em;
  margin-bottom: 10px;
  min-width: 20rem;
  background: transparent;
  transition: background-color 0.5s;
}
.input-domain:not([type]):focus,
.input-domain textarea:focus,
.input-domain select:focus {
  outline: 1px solid var(--vp-c-brand);
}

.input-domain::after {
  content: attr(data-post-fix);
  pointer-events: none;
  color: rgba(255, 252, 252, 0.5);
}
</style>
