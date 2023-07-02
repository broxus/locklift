<template>
  <transition name="fade" @after-leave="updateVisibility">
    <div v-if="visible" class="simple-toast" :class="type">
      {{ message }}
    </div>
  </transition>
</template>

<script land="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'BDKToast',
  props: {
    message: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'info',
    },
    duration: {
      type: Number,
      default: 3000,
    },
  },
  data() {
    return {
      visible: false,
    };
  },
  mounted() {
    this.show();
  },
  methods: {
    show() {
      this.visible = true;
      setTimeout(() => {
        this.visible = false;
      }, this.duration);
    },
    updateVisibility() {
      this.$emit('update');
    },
  },
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.simple-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #333;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 14px;
  z-index: 1000;
}

.simple-toast.success {
  background-color: #28a745;
}

.simple-toast.error {
  background-color: #dc3545;
}

.simple-toast.info {
  background-color: #17a2b8;
}
</style>
