<template>
  <span :class="['badge', type]" :style="{ 'vertical-align': vertical }">{{
    text
  }}</span>
</template>

<script setup lang="ts">
const props = defineProps({
  type: {
    type: String,
    default: 'tip',
  },
  text: String,
  vertical: {
    type: String,
    default: 'top',
  },
});
</script>

<style lang="stylus" scoped>
.badge
  display inline-block
  font-size 14px
  height 18px
  line-height 18px
  border-radius 0.25rem
  padding 0 6px
  color white
  background-color #42b983
  &.tip, &.green
    background-color #42b983
  &.error
    background-color #DA5961
  &.warning, &.warn, &.yellow
    background-color darken(#ffe564, 35%)
  & + &
    margin-left 5px
</style>
