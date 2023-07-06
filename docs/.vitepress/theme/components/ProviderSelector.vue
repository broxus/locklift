<script setup lang="ts">
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
        <p class="modal-title">Connect a wallet</p>
        <div class="buttons">
          <button
            class="button is-fullwidth provider-button"
            v-for="(provider, i) in providers"
            :key="i"
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
  position: fixed !important;
  transform: translate(-50%, -50%);
  top: 50% !important;
  left: 50% !important;
  width: 500px !important;
  min-width: 200px;

  min-height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  background: var(--vp-sidebar-bg-color);
  backdrop-filter: blur(10px);
}

.modal-background {
  z-index: 999 !important;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.provider-button {
  font-size: 0.9em;
  font-weight: 600;

  width: 150px;

  padding: 5px 12px;
  transition: background-color 0.1s;

  border: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg-mute);
  border-radius: 8px;
  text-align: center;
}

.provider-button:first-child {
  margin-right: 0.5rem;
}

.provider-button:hover,
.provider-button:focus {
  outline: none;
  color: var(--vp-c-brand);
  transition: color 0.25s;
  background-color: rgba(var(--vp-c-bg-mute), 0.8);
}
</style>
