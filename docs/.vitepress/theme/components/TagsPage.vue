<template>
  <div class="tags-wrapper">
    <!-- 标签集合 -->
    <TagList :tags="tags" :currentTag="currentTag" />

    <!-- 博客列表 -->
    <NoteAbstract
      class="list"
      :data="tagPages"
      :currentTag="currentTag"
      @paginationChange="paginationChange"
    ></NoteAbstract>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import TagList from './TagList.vue';
import NoteAbstract from './NoteAbstract.vue';
import { useData, inBrowser, useRoute } from 'vitepress';

const { theme } = useData<ReadonlyThemeConfig>();

const paginationChange = () => {
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 100);
};

const pages = theme.value.pageData.pages;

const tags = [
  { name: '全部', num: pages.length },
  ...theme.value.pageData.tags,
];

const currentTag = ref('');

const route = useRoute();

onMounted(() => {
  if (inBrowser) {
    // 服务端渲染不选标签
    currentTag.value =
      new URLSearchParams(location.search).get('tag') || '全部';
    watch(route, () => {
      const tag = new URLSearchParams(location.search).get('tag');
      if (tag) {
        currentTag.value = tag;
      }
    });
  }
});

const tagPages = computed(() => {
  const res = pages.filter((v) => v.tags && v.tags.includes(currentTag.value));
  return res.length ? res : pages;
});
</script>

<style lang="stylus" scoped>
@require '../styles/variable.styl'
.tags-wrapper
  max-width: $contentWidth
  margin: 0 auto;
  margin-bottom: 4em !important
  padding: 0 2.5rem;

@media (max-width: $MQMobile)
  .tags-wrapper
    padding: 0 0.6rem;
</style>
