<template>
  <div class="card">
    <div class="plugin-info">
      <a :href="'https://www.npmjs.com/package/' + plugin.npmPackage" class="plugin-name">{{
        plugin.name
      }}</a>
      <a :href="plugin.authorUrl" class="plugin-author">| {{ plugin.author }}</a>
    </div>
    <p class="description">{{ plugin.description }}</p>
    <div class="tags">
      <div class="tag" v-for="(tag, index) in plugin.tags" :key="index">{{ tag }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IPlugin } from './../../models';

export default defineComponent({
  name: 'PluginCard',
  props: {
    plugin: {
      type: Object as () => IPlugin,
      required: true,
    },
  },
});
</script>

<style scoped lang="scss">
.card {
  margin-bottom: 50px;
  .plugin-info {
    .plugin-name {
      font-size: 20px;
      line-height: 150%;
      font-weight: 700 !important;
      color: var(--vp-c-brand);
      margin-right: 18px;
    }
    .plugin-author {
      font-size: 16px;
      color: #6c6f74;
    }
  }

  .description {
    color: var(--vp-c-text-2);
    // стиль для описания
  }

  .tags {
    .tag {
      display: inline-block;
      margin-right: 8px;
      padding: 4px 16px;
      font-size: 13px;
      line-height: 19.5px;
      border: 1px solid var(--vp-c-text-2);
      border-radius: 5px;
      margin-right: 5px;

      // background-color: #f5f5f5; // цвет фона тега
    }
  }
}
</style>
