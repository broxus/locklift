<template>
  <div class="demo">
    <div>
      <label for="name">Name:</label>
      <input id="name" v-model="user.name" type="text" />
    </div>
    <div>
      <label for="age">Age:</label>
      <input id="age" v-model="user.age" type="number" />
    </div>
    <button @click="packData">Pack Data</button>
    <pre v-if="packedData">{{ packedData }}</pre>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  setup() {
    const user = ref({
      name: '',
      age: null,
    });

    const packedData = ref('');

    function packData() {
      packedData.value = JSON.stringify(user.value, null, 2);
    }

    return {
      user,
      packedData,
      packData,
    };
  },
});
</script>
