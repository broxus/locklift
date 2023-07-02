<script setup lang="ts">
import { useData, type DefaultTheme } from 'vitepress';
import { ref, shallowRef, watch, nextTick } from 'vue';

import OutlineItem from './BDKOutlineItem.vue';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const {
  serializeHeader,
  resolveHeaders,
  resolveTitle,
  useActiveAnchor,
  MenuItem,
} = require('./outline');

const { frontmatter, theme } = useData();

const headers = shallowRef<(typeof MenuItem)[]>([]);

const container = ref();
const marker = ref();

useActiveAnchor(container, marker);

const props = defineProps<{
  content: string | undefined;
}>();

const getHeaders = (
  range: number | false | DefaultTheme.Outline | [number, number] | 'deep' | undefined
) => {
  if (typeof document === 'undefined') {
    return [];
  }
  const _headers = Array.from(document.querySelectorAll('h2,h3,h4,h5,h6'))
    .filter(el => el.id && el.hasChildNodes())
    .map(el => {
      const level = Number(el.tagName[1]);

      return {
        title: serializeHeader(el),
        link: '#' + el.id,
        level,
      };
    });

  return resolveHeaders(_headers, range);
};

watch(
  () => props.content,
  () => {
    if (typeof window !== 'undefined') {
      nextTick(() => {
        const el = document.createElement('div');
        el.innerHTML = props.content ?? '';

        const outlineRange = frontmatter.value.outline ?? 2;
        headers.value = getHeaders(outlineRange);
      });
    }
  },
  { immediate: true }
);
</script>

<template>
  <div ref="container" class="asideOutline" :class="{ 'has-outline': headers.length > 0 }">
    <div class="content">
      <div ref="marker" class="outline-marker" />

      <div class="outline-title">
        {{ resolveTitle(theme) }}
      </div>

      <nav aria-labelledby="doc-outline-aria-label">
        <span id="doc-outline-aria-label" class="visually-hidden">
          Table of Contents for current page
        </span>
        <OutlineItem :headers="headers" :root="true" />
      </nav>
    </div>
  </div>
</template>

<style scoped>
.asideOutline {
  display: none;
}

.asideOutline.has-outline {
  display: block;
}

.content {
  position: relative;
  border-left: 1px solid var(--vp-c-divider);
  padding-left: 16px;
  font-size: 13px;
  font-weight: 500;
}

.outline-marker {
  position: absolute;
  top: 32px;
  left: -1px;
  z-index: 0;
  opacity: 0;
  width: 1px;
  height: 18px;
  background-color: var(--vp-c-brand);
  transition: top 0.25s cubic-bezier(0, 1, 0.5, 1), background-color 0.5s, opacity 0.25s;
}

.outline-title {
  letter-spacing: 0.4px;
  line-height: 28px;
  font-size: 13px;
  font-weight: 600;
}
.asideOutline ul {
  padding: 0 !important;
}
</style>
