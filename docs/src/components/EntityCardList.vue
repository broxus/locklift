<template>
  <div class="card-list">
    <EntityCard v-for="entity in entities" :entity="entity" :key="entity.name" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import EntityCard from './EntityCard.vue';
import { IEntityCard } from '../models';

export default defineComponent({
  name: 'EntityCardList',
  components: {
    EntityCard,
  },
  props: {
    entities: {
      type: Array as () => IEntityCard[],
      required: true,
    },
  },
});
</script>

<style scoped lang="scss"></style>
