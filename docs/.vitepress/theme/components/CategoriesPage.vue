<template>
  <div class="categories-wrapper">
    <!-- 分类集合 -->
    <ul class="category-wrapper">
      <li
        class="category-item"
        :class="currentCategory == item.name ? 'active' : ''"
        v-for="item in theme.pageData.categories"
        v-show="item.num"
        :key="item.name"
      >
        <a @click="clickCategory(item.name)">
          <span class="category-name">{{ item.name }}</span>
          <span class="post-num" :style="{ backgroundColor: getOneColor() }">
            {{ item.num }}
          </span>
        </a>
      </li>
    </ul>

    <!-- 博客列表 -->
    <NoteAbstract
      class="list"
      :data="categoryPages"
      @paginationChange="paginationChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useData, useRouter } from 'vitepress';
import { getOneColor } from '../utils';
import NoteAbstract from './NoteAbstract.vue';

const { theme } = useData();

const currentCategory = ref(theme.value.pageData.categories[0]);

onMounted(() => {
  if (globalThis.document) {
    const category = new URL(location.href).searchParams.get('category');
    if (category) {
      currentCategory.value = category;
    }
  }
});

const router = useRouter();

const clickCategory = (category: string) => {
  currentCategory.value = category;
  router.go('/categories/?category=' + category);
};

const categoryPages = computed(() =>
  theme.value.pageData.pages.filter(
    (v: any) => v.categories && v.categories.includes(currentCategory.value)
  )
);

const paginationChange = () => {
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 100);
};
</script>

<style lang="stylus" scoped>
@require '../styles/variable.styl'
.categories-wrapper
  max-width: $contentWidth;
  margin: 0 auto;
  padding: 4.6rem 2.5rem 0;
  .category-wrapper {
    list-style none
    padding-left 0
    .category-item {
      vertical-align: middle;
      margin: 4px 8px 10px;
      display: inline-block;
      cursor: pointer;
      border-radius: $borderRadius
      font-size: 13px;
      box-shadow var(--box-shadow)
      transition: all .5s
      background-color var(--background-color)
      &:hover, &.active {
        background $accentColor
        a span.category-name {
          color #fff
          .post-num {
            color $accentColor
          }
        }
      }
      a {
        display flex
        box-sizing border-box
        width 100%
        height 100%
        padding: 8px 14px;
        justify-content: space-between
        align-items center
        color: #666
        .post-num {
          margin-left 4px
          width 1.2rem;
          height 1.2rem
          text-align center
          line-height 1.2rem
          border-radius $borderRadius
          font-size .7rem
          color #fff
        }
      }
    }
  }

@media (max-width: $MQMobile)
  .categories-wrapper
    padding: 4.6rem 1rem 0;
  .page-edit
    .edit-link
      margin-bottom .5rem
    .last-updated
      font-size .8em
      float none
      text-align left
</style>
