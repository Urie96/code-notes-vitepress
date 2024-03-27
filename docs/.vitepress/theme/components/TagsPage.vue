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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import TagList from './TagList.vue';
import NoteAbstract from './NoteAbstract.vue';
import { useData, inBrowser } from 'vitepress';

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

const currentTag = ref('全部');

const onHashChange = () => {
  const tag = decodeURIComponent(location.hash?.substring?.(1) || '');
  if (tag) {
    currentTag.value = tag;
  }
};

onMounted(() => {
  if (inBrowser) {
    // 服务端渲染不选标签
    onHashChange();
    window.addEventListener('hashchange', onHashChange);
  }
});

onBeforeUnmount(() => {
  if (inBrowser) {
    window.removeEventListener('hashchange', onHashChange);
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