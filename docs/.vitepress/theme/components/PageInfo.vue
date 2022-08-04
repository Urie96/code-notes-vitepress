<template>
  <div class="page-info">
    <reco-icon v-if="pageInfo.author || theme.author" icon="reco-account">
      <span>{{ pageInfo.author || theme.author }}</span>
    </reco-icon>
    <reco-icon v-if="pageInfo.date" icon="reco-date">
      <span>{{ formatDateValue(pageInfo.date) }}</span>
    </reco-icon>
    <reco-icon v-if="showAccessNumber === true" icon="reco-eye"> </reco-icon>
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
        @click.stop="router.go('/categories/?category=' + subItem)"
        >{{ subItem }}</span
      >
    </reco-icon>
    <reco-icon v-if="pageInfo.tags?.length" icon="reco-tag" class="tags">
      <span
        v-for="(subItem, subIndex) in pageInfo.tags"
        :key="subIndex"
        class="tag-item"
        :class="{ active: currentTag == subItem }"
        @click.stop="router.go('/tags/?tag=' + subItem)"
        >{{ subItem }}</span
      >
    </reco-icon>
  </div>
</template>

<script setup lang="ts">
import { useData, useRouter } from 'vitepress';
const { theme } = useData();

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
  author: {
    type: String,
    default: '',
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

// const goTags = (tag) => {
//   if (instance.$route.path !== `/tag/${tag}/`) {
//     instance.$router.push({ path: `/tag/${tag}/` });
//   }
// };

const formatDateValue = (timestamp: number) => {
  const { lang } = theme as any;
  return new Intl.DateTimeFormat(lang).format(new Date(timestamp));
};
</script>

<style lang="stylus" scoped>
@require '../styles/variable.styl'
.page-info
  color: #7F7F7F
  font-size: 15px;
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
@media (max-width: $MQMobile)
  .tags
    display block
    margin-left 0 !important
</style>
