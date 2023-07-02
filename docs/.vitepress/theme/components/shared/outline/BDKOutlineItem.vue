<script setup lang="ts">
import { nextTick } from 'vue';

import { type MenuItem } from './outline';

defineProps<{
  headers: MenuItem[];
  root?: boolean;
}>();

const emit = defineEmits(['update-marker']);

async function onClick(event: MouseEvent) {
  if (typeof document === 'undefined') {
    return;
  }

  const el = event.target as HTMLAnchorElement;
  const id = '#' + el.href.split('#')[1];
  const heading = document.querySelector<HTMLAnchorElement>(decodeURIComponent(id));
  heading?.focus();
  await nextTick();
  emit('update-marker');
}
</script>

<template>
  <ul :class="root ? 'root' : 'nested'">
    <li v-for="(item, index) in headers" :key="index">
      <a class="outline-link" :href="item.link" :title="item.title" @click="onClick">{{
        item.title
      }}</a>
      <template v-if="item.children?.length">
        <OutlineItem :headers="item.children" />
      </template>
    </li>
  </ul>
</template>

<style scoped>
.root {
  position: relative;
  z-index: 1;
}

.nested {
  padding-left: 13px;
}

.outline-link {
  display: block;
  line-height: 28px;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.5s;
  font-weight: 500;
}

.outline-link:hover,
.outline-link.active {
  color: var(--vp-c-text-1);
  transition: color 0.25s;
}

.outline-link.nested {
  padding-left: 13px;
}
</style>
