<template>
  <div class="image-container">
    <img :src="imageSrc" />
  </div>
</template>

<script lang="ts">
export default {
  props: {
    imageSrc: {
      type: String,
      required: true,
    },
  },
};
</script>

<style scoped>
.image-container img {
  max-width: 75%;
  height: auto;
}
</style>
