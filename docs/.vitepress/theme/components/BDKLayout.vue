<script setup lang="ts">
import { useRoute, useData } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { onMounted, computed, ref, Ref, onUpdated, provide, reactive } from 'vue';

import { getApiReference, ApiRefPage } from './../../../src/api';
import BDKWalletControl from './BDKWalletControl.vue';
import BDKOutline from './shared/outline/BDKOutline.vue';
import { testContract } from '../../../src/helpers';
import { Address } from 'everscale-inpage-provider';

const { Layout } = DefaultTheme;
const route = useRoute();
const { frontmatter } = useData();
const dynamicContent = ref<string | undefined>('');

const projectName = frontmatter.value.projectName ?? '';
let pageName = computed(() => {
  let name = route.path.split('/').pop() ?? '';

  return name.replace('.html', '');
});

let apiReference: Ref<void | ApiRefPage | undefined> = ref();

const isApiReferencePage = computed(() => {
  return frontmatter.value.apiReference ?? false;
});

const addresses = testContract.getAddress();
const testAddress = reactive(new Address(addresses.address));
const dublicateTestAddress = reactive(new Address(addresses.dublicateAddress));

provide('testAddress', testAddress);
provide('dublicateTestAddress', dublicateTestAddress);

onMounted(async () => {
  if (!isApiReferencePage.value) {
    return;
  }

  apiReference.value = await getApiReference(projectName, pageName.value);
  dynamicContent.value = apiReference.value?.content;
});

onUpdated(async () => {
  if (!isApiReferencePage.value) {
    return;
  }

  apiReference.value = await getApiReference(projectName, pageName.value);
  dynamicContent.value = apiReference.value?.content;
});
</script>

<template>
  <Layout>
    <template #nav-bar-content-after>
      <Suspense>
        <BDKWalletControl />
      </Suspense>
    </template>
    <template v-if="isApiReferencePage" #aside-outline-before>
      <BDKOutline :content="dynamicContent" />
    </template>
  </Layout>
</template>
