<template>
  <ClientOnly>
    <SWPopup />
  </ClientOnly>
  <Layout>
    <template #doc-before v-if="frontmatter.title">
      <section>
        <div class="page-title vp-doc">
          <h1 class="title">{{ frontmatter.title }}</h1>
          <PageInfo :pageInfo="frontmatter" :showAccessNumber="true" />
        </div>
      </section>
    </template>
    <template #doc-after>
      <Valine />
    </template>
  </Layout>
  <div
    id="expand-img"
    v-if="expandImageSrc"
    :style="expandImageStyle"
    @click="expandImageOnClick"
  ></div>
</template>

<script setup lang="ts">
import { onMounted, watch, ref, computed } from 'vue';
import DefaultTheme from 'vitepress/theme';
import { useData, useRoute } from 'vitepress';
import SWPopup from './SWPopup.vue';
import PageInfo from './PageInfo.vue';
import Valine from './Valine.vue';

const { frontmatter } = useData<ReadonlyThemeConfig>();

const { Layout } = DefaultTheme;

const expandImageSrc = ref('');

const expandImageStyle = computed(() => {
  return {
    'background-image': `url(${expandImageSrc.value})`,
  };
});

const expandImageOnClick = () => {
  expandImageSrc.value = '';
};

watch(expandImageSrc, () => {
  document.body.style.overflow = expandImageSrc.value ? 'hidden' : '';
});

const route = useRoute();

onMounted(() => {
  const imageOnClick = () => {
    document
      .querySelectorAll<HTMLImageElement>('main .vp-doc img')
      .forEach((img) => {
        img.addEventListener('click', (e) => {
          e.preventDefault();
          expandImageSrc.value = img.src;
        });
      });
  };
  imageOnClick();
  watch(route, () => {
    expandImageSrc.value = '';
    setTimeout(imageOnClick, 300);
  });
});
</script>

<style lang="stylus" scoped>
section
  margin-bottom: 2rem;
  .title
    margin-block-start: 0.83em;
    margin-block-end: 0.83em;

#expand-img
  background-size: contain
  background-color: rgba(0,0,0,.5)
  background-repeat: no-repeat
  background-position: center
  width: 100%
  height: 100%
  position: fixed
  z-index: 10000
  top:0
  left:0
  cursor: zoom-out
</style>
