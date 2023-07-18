<template>
  <div class="plugin-list">
    <PluginCard
      v-for="(plugin, index) in plugins"
      :key="index"
      :plugin="plugin"
      :link="plugin.authorUrl"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PluginCard from './PluginCard.vue';

interface IPlugin {
  name: string;
  npmPackage?: string;
  author: string;
  authorUrl: string;
  description: string;
  tags: string[];
}

export default defineComponent({
  name: 'PluginCardList',
  components: {
    PluginCard,
  },
  props: {
    plugins: {
      type: Array as () => IPlugin[],
      required: true,
    },
  },
});
</script>

<style scoped lang="scss">
.plugin-list {
}
</style>
