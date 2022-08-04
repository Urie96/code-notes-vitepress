<template>
  <div class="abstract-wrapper">
    <NoteAbstractItem
      v-for="item in currentPageData"
      :key="item.link"
      :item="item"
      :currentPage="currentPage"
      :currentTag="currentTag"
    />
    <Pagination
      class="pagation"
      :total="data.length"
      :currentPage="currentPage"
      @getCurrentPage="getCurrentPage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import NoteAbstractItem from './NoteAbstractItem.vue';
import Pagination from './Pagination.vue';
import { setStoragePage, getStoragePage } from '../utils/';

const props = defineProps({
  data: {
    type: Array,
    default: [],
  },
  currentTag: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['paginationChange']);

const currentPage = ref(1);
const perPage = 10;

const currentPageData = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  const end = currentPage.value * perPage;

  return props.data.slice(start, end);
});

const getCurrentPage = (page: number) => {
  currentPage.value = page;
  setStoragePage(page);
  emit('paginationChange', page);
};

onMounted(() => {
  currentPage.value = getStoragePage() || 1;
});

watch(
  () => props.data,
  () => {
    console.log(currentPage.value);
    currentPage.value = 1;
  }
);
</script>

<style lang="stylus" scoped>
.abstract-wrapper
  width 100%
</style>
