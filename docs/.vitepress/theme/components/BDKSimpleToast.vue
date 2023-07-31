<template>
  <div>
    <div v-if="isCollapsed" class="toast-text-collapsed">
      {{ collapsedText }}
      <button v-if="shouldShowButton" @click="handleClick">
        <svg xmlns="http://www.w3.org/2000/svg" height="1.3em" viewBox="0 0 512 512">
          <!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
          <path
            d="M32 32C14.3 32 0 46.3 0 64v96c0 17.7 14.3 32 32 32s32-14.3 32-32V96h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H32zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H64V352zM320 32c-17.7 0-32 14.3-32 32s14.3 32 32 32h64v64c0 17.7 14.3 32 32 32s32-14.3 32-32V64c0-17.7-14.3-32-32-32H320zM448 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v64H320c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32V352z"
          />
        </svg>
      </button>
    </div>
    <div v-else class="toast-text-expanded">
      {{ text }}
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'BDKSimpleToast',
  props: {
    text: {
      type: String,
      required: true,
    },
    collapseLength: {
      type: Number,
      default: 60,
    },
  },

  setup(props) {
    const isCollapsed = ref(true);
    const collapsedText = computed(() => {
      return props.text.slice(0, props.collapseLength);
    });

    const shouldShowButton = computed(() => {
      return props.text.length > props.collapseLength;
    });

    const expandText = () => {
      if (isCollapsed.value && shouldShowButton.value) {
        isCollapsed.value = false;
      } else {
        closeToast();
      }
    };

    const handleClick = () => {
      if (shouldShowButton.value) {
        expandText();
      } else {
        closeToast();
      }
    };

    return {
      isCollapsed,
      collapsedText,
      handleClick,
      shouldShowButton,
    };
  },
};
</script>

<style scoped>
.toast-text-collapsed {
  display: flex;
  align-items: center;
}

svg {
  align-self: center;
  fill: whitesmoke;
  vertical-align: middle;
}

button {
  background: none;
  border: none;
  cursor: pointer;

  margin-left: 0.5rem;
}
</style>
