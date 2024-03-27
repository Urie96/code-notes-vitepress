<template>
  <div class="page-info">
    <reco-icon v-if="pageInfo.author || theme.author" icon="reco-account">
      <span>{{ pageInfo.author || theme.author }}</span>
    </reco-icon>
    <ClientOnly>
      <reco-icon v-if="pageInfo.date" icon="reco-date">
        <span>{{ formatDateValue(pageInfo.date) }}</span>
      </reco-icon>
      <reco-icon v-if="showAccessNumber === true" icon="reco-eye">
        <span class="leancloud-visitors" :id="getPath()">
          <a class="leancloud-visitors-count" style="color: #999"></a>
        </span>
      </reco-icon>
    </ClientOnly>
    <reco-icon
      v-if="pageInfo.categories?.length"
      icon="reco-category"
      class="tags"
    >
      <span
        v-for="(subItem, subIndex) in pageInfo.categories"
        :key="subIndex"
        class="tag-item"
        :class="{ active: currentTag == subItem }"
        @click.stop="router.go('/categories/#' + subItem)"
        >{{ subItem }}</span
      >
    </reco-icon>
    <reco-icon v-if="pageInfo.tags?.length" icon="reco-tag" class="tags">
      <span
        v-for="(subItem, subIndex) in pageInfo.tags"
        :key="subIndex"
        class="tag-item"
        :class="{ active: currentTag == subItem }"
        @click.stop="router.go('/tags/#' + subItem)"
        >{{ subItem }}</span
      >
    </reco-icon>
  </div>
</template>

<script setup lang="ts">
import { useData, useRouter } from 'vitepress';
const data = useData<ReadonlyThemeConfig>();
const { theme } = data;

const router = useRouter();

const props = defineProps({
  pageInfo: {
    type: Object,
    default() {
      return {
        categories: [],
        tags: [],
        author: '',
        date: 0,
      };
    },
  },
  currentTag: {
    type: String,
    default: '',
  },
  showAccessNumber: {
    type: Boolean,
    default: false,
  },
});

const formatDateValue = (timestamp: number) => {
  const { lang } = data;
  return new Intl.DateTimeFormat(lang.value).format(new Date(timestamp));
};

const getPath = () => window.location.pathname;
</script>

<style lang="stylus" scoped>
@require '../styles/variable.styl'
.page-info
  color: #7F7F7F
.iconfont
  display inline-block
  line-height 1.5rem
  &:not(:last-child)
    margin-right 2rem
  span
    margin-left 0.5rem
.tags
  .tag-item
    font-family Ubuntu, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif
    cursor pointer
    &.active
      color $accentColor
    &:hover
      color $accentColor
</style>