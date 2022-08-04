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

const currentTag = ref('全部');

const onTagChange = (tag: string) => {
  currentTag.value = tag;
};

onMounted(() => {
  if (globalThis.document) {
    currentTag.value = new URLSearchParams(location.search).get('tag') || '';
  }
});

const tagPages = computed(() => {
  const res = pages.filter(
    (v: any) => v.tags && v.tags.includes(currentTag.value)
  );
  if (res.length) {
    return res;
  } else {
    return pages;
  }
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
