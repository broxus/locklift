<script setup lang="ts">
/* eslint-disable */
defineProps<{
  providers: { title: string; object: any }[];
  onSelect: (provider: any) => void;
}>();
</script>

<template>
  <div class="modal is-active">
    <div class="modal-background" />

    <div class="modal-content select-provider-modal">
      <div class="box">
        <p class="is-size-5 mb-3">Connect a wallet</p>
        <div class="buttons">
          <button
            v-for="(provider, i) in providers"
            :key="i"
            class="button is-fullwidth"
            @click="onSelect(provider.object)"
          >
            {{ provider.title }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="css">
.select-provider-modal {
  z-index: 100000 !important;
  width: min(20rem, 90vw) !important;
}
</style>
