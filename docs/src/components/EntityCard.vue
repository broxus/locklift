<template>
  <div class="card">
    <div class="entity-info">
      <a
        :href="
          entity.npmPackage
            ? 'https://www.npmjs.com/package/' + entity.npmPackage
            : entity.githubUrl
        "
      >
        <h3 :id="entity.name" class="entity-name">{{ entity.name }}</h3>
      </a>
      <a :href="entity.authorUrl" class="entity-author">| {{ entity.author }}</a>
    </div>
    <p class="description">{{ entity.description }}</p>
    <div v-if="entity.tags" class="tags">
      <div v-for="(tag, index) in entity.tags" :key="index" class="tag">{{ tag }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { IEntityCard } from './../models';

export default defineComponent({
  name: 'EntityCard',
  props: {
    entity: {
      type: Object as () => IEntityCard,
      required: true,
    },
  },
});
</script>

<style scoped lang="scss">
.card {
  margin-bottom: 50px;
  .entity-info {
    .entity-name {
      display: inline-block;
      font-size: 20px !important;
      line-height: 150% !important;
      font-weight: 700 !important;
      color: var(--vp-c-brand);
      margin-right: 18px !important;
    }
    .entity-author {
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

      // background-color: #f5f5f5;
    }
  }
}
</style>
