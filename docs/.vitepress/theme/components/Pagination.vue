<template>
  <div class="pagation" v-show="show">
    <div class="pagation-list">
      <span
        class="jump"
        v-show="currentPage > 1"
        @click="goPrev"
        unselectable="on"
        >{{ pagationLocales.prev }}</span
      >
      <span v-show="efont" class="jump" @click="jumpPage(1)">1</span>
      <span class="ellipsis" v-show="efont">...</span>
      <span
        class="jump"
        v-for="num in indexs"
        :key="num"
        :class="{ bgprimary: currentPage == num }"
        @click="jumpPage(num)"
        >{{ num }}</span
      >
      <span class="ellipsis" v-show="efont && currentPage < pages - 4"
        >...</span
      >
      <span
        v-show="efont && currentPage < pages - 4"
        class="jump"
        @click="jumpPage(pages)"
        >{{ pages }}</span
      >
      <span class="jump" v-show="currentPage < pages" @click="goNext">
        {{ pagationLocales.next }}
      </span>
      <span class="jumppoint">{{ pagationLocales.jump }}</span>
      <span class="jumpinp">
        <input
          type="text"
          v-model="changePage"
          style="background-color: var(--vp-c-bg)"
        />
      </span>
      <span class="jump gobtn" @click="jumpPage(changePage)">
        {{ pagationLocales.go }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps({
  total: {
    type: Number,
    default: 10,
  },
  perPage: {
    type: Number,
    default: 10,
  },
  currentPage: {
    type: Number,
    default: 1,
  },
});

const emit = defineEmits(['getCurrentPage']);

const changePage = ref(''); // 跳转页

const pages = Math.ceil(props.total / (props.perPage || 10));

const show = pages && pages != 1;

const efont = computed(() => (pages < 7 ? false : props.currentPage > 5));

const indexs = computed(() => {
  var left = 1;
  var right = pages;
  var ar = [];
  if (pages >= 7) {
    if (props.currentPage > 5 && props.currentPage < pages - 4) {
      left = Number(props.currentPage) - 3;
      right = Number(props.currentPage) + 3;
    } else {
      if (props.currentPage <= 5) {
        left = 1;
        right = 7;
      } else {
        right = pages;

        left = pages - 6;
      }
    }
  }
  while (left <= right) {
    ar.push(left);
    left++;
  }
  return ar;
});

const pagationLocales = {
  prev: '上一页',
  next: '下一页',
  go: '前往',
  jump: '跳转至',
};

const goPrev = () => {
  if (props.currentPage > 1) {
    emit('getCurrentPage', props.currentPage - 1);
  }
};

const goNext = () => {
  if (props.currentPage < pages) {
    emit('getCurrentPage', props.currentPage + 1);
  }
};

const jumpPage = (id: any) => {
  const numId = parseInt(id);

  if (numId <= pages && numId > 0) {
    emit('getCurrentPage', numId);
    return;
  }
  alert(`请输入大于0，并且小于${pages}的页码！`);
};
</script>

<style lang="stylus" scoped>
@require '../styles/variable.styl'
.pagation
  font-weight: 700;
  text-align: center;
  color: #888;
  color: var(--text-color)
  margin: 20px auto 0;
  background: #f2f2f2;
  background: var(--background-color);
  .pagation-list
    background-color: var(--vp-c-bg);
    font-size: 0;
    line-height: 50px;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    span
      font-size: 14px;
      &.jump, &.jumpinp input
        box-shadow: var(--box-shadow)
        border 1px solid var(--border-color)!important
        border: 1px solid #ccc;
      &.jump
        padding: 5px 8px;
        -webkit-border-radius: 4px;
        -moz-border-radius: 4px;
        border-radius: 4px;
        cursor: pointer;
        margin-left: 5px;
      &.jumpinp
        input
          width: 55px;
          height: 26px;
          background-color: var(--background-color)
          font-size: 13px;
          -webkit-border-radius: 4px;
          -moz-border-radius: 4px;
          border-radius: 4px;
          text-align: center;
          outline none
      &.bgprimary
        cursor: default;
        color: #fff;
        background: $accentColor;
        border-color: $accentColor;
      &.ellipsis
        padding: 0px 8px;
      &.jumppoint
        margin: 0 10px 0 30px;
</style>
