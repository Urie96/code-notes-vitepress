<template>
  <Transition
    name="module"
    @enter="setStyle"
    @appear="setStyle"
    @before-leave="setStyle"
    @after-appear="unsetStyle"
    @after-enter="unsetStyle"
  >
    <slot></slot>
  </Transition>
</template>

<script setup lang="ts">
const props = defineProps({
  delay: {
    type: String,
    default: '0',
  },
  duration: {
    type: String,
    default: '.25',
  },
  transform: {
    type: Array,
    default() {
      return ['translateY(-20px)', 'translateY(0)'];
    },
  },
});

const setStyle = (items: any) => {
  items.style.transition = `transform ${props.duration}s ease-in-out ${props.delay}s, opacity ${props.duration}s ease-in-out ${props.delay}s`;
  items.style.transform = props.transform[0];
  items.style.opacity = 0;
};

const unsetStyle = (items: any) => {
  items.style.transform = props.transform[1];
  items.style.opacity = 1;
};
</script>
