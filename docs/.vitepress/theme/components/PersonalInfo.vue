<template>
  <div class="personal-info-wrapper">
    <img
      class="personal-img"
      v-if="theme.authorAvatar"
      :src="theme.authorAvatar"
      alt="author-avatar"
    />
    <h3 class="name" v-if="theme.author">
      {{ theme.author }}
    </h3>
    <div class="num">
      <div>
        <h3>{{ theme.pageData.pages.length }}</h3>
        <h6>文章</h6>
      </div>
      <div>
        <h3>{{ theme.pageData.tags.length }}</h3>
        <h6>标签</h6>
      </div>
    </div>
    <ul class="social-links">
      <li
        class="social-item"
        v-for="(item, index) in theme.personalInfoSocialLinks"
        :key="index"
      >
        <reco-icon
          :icon="item.icon"
          :link="item.link"
          :style="{ color: 'rgb(244, 126, 96)' }"
        />
      </li>
    </ul>
    <hr />
  </div>
</template>

<script setup lang="ts">
import { useData } from 'vitepress';
const { theme } = useData<ReadonlyThemeConfig>();
</script>

<style lang="stylus" scoped>
.personal-info-wrapper {
  h1, h2, h3, h4, h5, h6 {
    font-weight: 500;
    line-height: 1.25;
  }
  h3 {
    font-size: 1.2rem;
    margin 1em 0
  }
  h6 {
    font-size: 12px
  }
  .personal-img {
    display block
    margin 2rem auto 1rem
    width 6rem
    height 6rem
    border-radius 50%
  }
  .name {
    font-size 1rem
    text-align center
    color var(--text-color)
  }
  .num {
    display flex
    margin 0 auto 1rem
    width 80%
    > div {
      text-align center
      flex 0 0 50%
      &:first-child {
        border-right 1px solid #333
      }
      h3 {
        line-height auto
        margin 0 0 .6rem
        color var(--text-color)
      }
      h6 {
        line-height auto
        color var(--text-color)
        margin 0
      }
    }
  }
  .social-links {
    box-sizing border-box
    display flex
    flex-wrap wrap
    padding 10px
    .social-item {
      width 39px
      height 36px
      line-height 36px
      text-align center
      list-style none
      transition transform .3s !important
      &:hover {
        transform scale(1.08)
      }
      i {
        cursor pointer
        font-size 22px
      }
    }
  }
}
</style>