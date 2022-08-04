<template>
  <i :class="clazz" @click="onClick"><slot></slot></i>
</template>

<script setup lang="ts">
const ICON_REGEXP = /^(\w+)\-/;
const props = defineProps({
  icon: {
    type: String,
    default: '',
  },
  link: {
    type: String,
    default: '',
  },
});

let clazz = '';

if (ICON_REGEXP.test(props.icon)) {
  clazz = props.icon.replace(ICON_REGEXP, (...args) => {
    return args[1] === 'reco' ? `iconfont ${args[0]}` : `${args[1]} ${args[0]}`;
  });
}

const onClick = () => {
  if (props.link) {
    window.open(props.link);
  }
};
</script>
