<template>
  <div class="tags-wrapper">
    <!-- 标签集合 -->
    <TagList :tags="tags" :currentTag="currentTag" @onTagChange="onTagChange" />

    <!-- 博客列表 -->
    <NoteAbstract
      class="list"
      :data="tagPages"
      @paginationChange="paginationChange"
    ></NoteAbstract>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import TagList from './TagList.vue';
import NoteAbstract from './NoteAbstract.vue';
import { useData } from 'vitepress';

const { theme } = useData();

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

onMounted(() => {
  if (globalThis.document) {
    // 服务端渲染不选标签
    currentTag.value =
      new URLSearchParams(location.search).get('tag') || '全部';
  }
});

const onTagChange = (tag: string) => {
  currentTag.value = tag;
};

const tagPages = computed(() => {
  const res = pages.filter(
    (v: any) => v.tags && v.tags.includes(currentTag.value)
  );
  return res.length ? res : pages;
});
</script>

<style lang="stylus" scoped>
@require '../styles/variable.styl'
.tags-wrapper
  max-width: $contentWidth
  margin: 0 auto;
  padding: 4.6rem 2.5rem 0;

@media (max-width: $MQMobile)
  .tags-wrapper
    padding: 5rem 0.6rem 0;
</style>
