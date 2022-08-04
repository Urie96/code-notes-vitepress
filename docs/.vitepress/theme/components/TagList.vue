<template>
  <div class="tags">
    <span
      v-for="item in tags"
      v-show="item.num"
      :key="item.name"
      :class="{ active: item.name == currentTag }"
      :style="{ backgroundColor: getOneColor() }"
      @click="clickTag(item.name)"
    >
      {{ item.name }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vitepress';
import { getOneColor } from '../utils';

const router = useRouter();

const props = defineProps({
  tags: {
    type: Array,
    default: [],
  },
  currentTag: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['onTagChange']);
const clickTag = (tag: string) => {
  emit('onTagChange', tag); // fix: build之后点击tag，浏览器地址栏会变化，但是currentTag不刷新
  router.go('/tags/?tag=' + tag);
};
</script>

<style lang="stylus" scoped>
@require '../styles/variable.styl'
.tags
  margin 30px 0
  span
    vertical-align: middle;
    margin: 4px 4px 10px;
    padding: 4px 8px;
    display: inline-block;
    cursor: pointer;
    border-radius: $borderRadius
    background: #fff;
    color: #fff;
    line-height 13px
    font-size: 13px;
    box-shadow var(--box-shadow)
    transition: all .5s
    &:hover
      transform scale(1.04)
    &.active
      transform scale(1.2)
</style>
