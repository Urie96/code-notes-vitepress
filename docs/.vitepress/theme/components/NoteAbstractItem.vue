<template>
  <div class="abstract-item" @click="router.go(item.link)">
    <reco-icon v-if="item.sticky" icon="reco-sticky" />
    <div class="title">
      <reco-icon v-if="item.keys" icon="reco-lock" />
      <a>{{ item.title }}</a>
    </div>
    <div v-if="item.excerpt" class="abstract" v-html="item.excerpt"></div>
    <PageInfo :pageInfo="item" :currentTag="currentTag"> </PageInfo>
  </div>
</template>

<script setup lang="ts">
import PageInfo from './PageInfo.vue';
import { useRouter } from 'vitepress';

const router = useRouter();

const props = defineProps({
  item: {
    type: Object,
    default() {
      return {
        title: 'asd',
      };
    },
  },
  currentTag: {
    type: String,
    default: '',
  },
});
</script>

<style lang="stylus" scoped>
@require '../styles/variable.styl'
.abstract-item
  position relative
  margin: 0 auto 20px;
  padding: 16px 20px;
  width 100%
  overflow: hidden;
  border-radius: $borderRadius
  box-shadow: var(--box-shadow);
  box-sizing: border-box;
  transition all .3s
  background-color var(--background-color)
  cursor: pointer;
  > * {
    pointer-events: auto;
  }
  .reco-sticky
    position absolute
    top 0
    left 0
    display inline-block
    color $accentColor
    font-size 2.4rem
  &:hover
    box-shadow: var(--box-shadow-hover)
  .title
    position: relative;
    font-size: 1.28rem;
    line-height: 46px;
    display: inline-block;
    a
      color: var(--text-color);
      font-weight: 500;
    .reco-lock
      font-size 1.28rem
      color $accentColor
    &:after
      content: "";
      position: absolute;
      width: 100%;
      height: 2px;
      bottom: 0;
      left: 0;
      background-color: $accentColor;
      visibility: hidden;
      -webkit-transform: scaleX(0);
      transform: scaleX(0);
      transition: .3s ease-in-out;
    &:hover a
      color $accentColor
    &:hover:after
      visibility visible
      -webkit-transform: scaleX(1);
      transform: scaleX(1);
  .tags
    .tag-item
      &.active
        color $accentColor
      &:hover
        color $accentColor
@media (max-width: $MQMobile)
  .tags
    display block
    margin-top 1rem;
    margin-left: 0!important;
</style>
