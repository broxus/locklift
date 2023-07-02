<template>
  <div v-if="apiReference.content === '' || apiReference.content === undefined">Loading...</div>
  <div v-else class="page-container">
    <div class="page-content" v-html="apiReference.content"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, nextTick } from 'vue';

import { getApiReference } from './../../../src/api';
import { NodeEnv } from './../../../src/config';

interface ApiResponse {
  content: string;
}

export default defineComponent({
  name: 'BDKPage',
  props: {
    projectName: {
      type: String,
      default: '',
    },
    pageName: {
      type: String,
      default: '',
    },
    nodeEnv: {
      type: String as () => NodeEnv,
      default: 'local',
    },
  },
  setup(props) {
    const apiReference = ref<ApiResponse>({ content: '' });

    onMounted(async () => {
      const response = await getApiReference(props.projectName, props.pageName, props.nodeEnv);
      if (response) {
        apiReference.value = response;
      }

      await nextTick();

      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const hash = window.location.hash;
        if (hash) {
          const element = document.getElementById(hash.substring(1));
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    });

    return { apiReference };
  },
});
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: row;
}

.page-outline {
  position: fixed;
  top: 96px;
  right: calc(100vw - 85.3%);
  height: 100vh;
  width: 200px;
  overflow-y: auto;
}
@media screen and (max-width: 1279px) {
  .page-outline {
    display: none;
  }
}
</style>
