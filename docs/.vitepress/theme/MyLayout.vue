<!--.vitepress/theme/MyLayout.vue-->
<script setup>
import DefaultTheme from 'vitepress/theme';
import { onUpdated, onMounted, onActivated } from 'vue';
console.log(12);
onMounted(() => {
  console.log(132);
});
onActivated(() => {
  console.log(1323);
});

const { Layout } = DefaultTheme;
console.log(Layout);
</script>

<template>
  <Layout>
    <template #aside-outline-before> My custom sidebar top content </template>
  </Layout>
</template>
