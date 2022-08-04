<template>
  <ClientOnly>
    <SWPopup />
  </ClientOnly>
  <HomePage v-if="path === '/'" />
  <!-- <TagsPage v-else-if="path === '/tags/'" /> -->
  <CategoriesPage v-else-if="path === '/categories/'" />
  <Layout v-else>
    <template #doc-before v-if="frontmatter.title">
      <section>
        <div class="page-title vp-doc">
          <h1 class="title">{{ frontmatter.title }}</h1>
          <PageInfo :pageInfo="frontmatter" />
        </div>
      </section>
    </template>
  </Layout>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme';
import { useData } from 'vitepress';
import SWPopup from './SWPopup.vue';
import PageInfo from './PageInfo.vue';
import HomePage from './HomePage.vue';
import CategoriesPage from './CategoriesPage.vue';
const { frontmatter } = useData();

const { Layout } = DefaultTheme;
</script>

<style lang="stylus" scoped>
section
  margin-bottom: 2rem;
  .title
    margin-block-start: 0.83em;
    margin-block-end: 0.83em;
</style>
