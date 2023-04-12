<template>
  <div class="timeline-wrapper">
    <ul class="timeline-content">
      <ModuleTransition>
        <li v-show="recoShowModule" class="desc">昨日重现！</li>
      </ModuleTransition>
      <ModuleTransition
        :delay="String(0.08 * (index + 1))"
        v-for="(item, index) in timePages"
        :key="index"
      >
        <li v-show="recoShowModule">
          <h3 class="year">{{ item.year }}</h3>
          <ul class="year-wrapper">
            <li v-for="(subItem, subIndex) in item.pages" :key="subIndex">
              <span class="date">
                {{ subItem?.dateString }}
              </span>
              <span class="title" @click="router.go(subItem.link)">
                {{ subItem.title }}
              </span>
            </li>
          </ul>
        </li>
      </ModuleTransition>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useData } from 'vitepress';

const router = useRouter();
const { theme } = useData<ReadonlyThemeConfig>();

const recoShowModule = ref(true);

const { pages } = theme.value.pageData;

const timePages: {
  year: number;
  pages: (Page & { dateString: string })[];
  dateString?: string;
}[] = [];

pages.forEach((v) => {
  if (v.date) {
    const data = new Date(v.date);
    const year = data.getFullYear();
    const month = data.getMonth() + 1;
    const day = data.getDate();
    const thisYearPages = timePages.find((v) => v.year === year);
    const thisPage = {
      ...v,
      dateString: `${month}-${day}`,
    };
    if (thisYearPages) {
      thisYearPages.pages.push(thisPage);
    } else {
      timePages.push({
        year,
        pages: [thisPage],
      });
    }
  }
});
</script>

<style lang="stylus" scoped>
@require '../styles/variable.styl'

.timeline-wrapper
  ol,ul
    padding-left: 1.2em;
  max-width: $contentWidth;
  margin: 0 auto;
  padding: 2.5rem 2.5rem 0;
  .timeline-content
    box-sizing border-box
    position relative
    list-style none
    padding-bottom: 4em
    &::after {
      content: " ";
      position: absolute;
      top: 14px;
      left: 0;
      z-index: -1;
      margin-left: -2px;
      width: 4px;
      height: 100%;
      background: var(--border-color);
    }
    .desc, .year {
      position: relative;
      color var(--text-color);
      font-size 16px
      &:before {
        content: " ";
        position: absolute;
        z-index 2;
        left: -20px;
        top: 50%;
        margin-left: -4px;
        margin-top: -4px;
        width: 8px;
        height: 8px;
        background: var(--background-color);
        border: 1px solid var(--border-color);
        border-radius: 50%;
      }
    }
    .year {
      margin: 80px 0 0px;
      color var(--text-color);
      font-weight: 700;
      font-size 26px
    }
    .year-wrapper {
      padding-left 0!important
      li {
        display flex
        padding 30px 0 10px
        list-style none
        border-bottom: 1px dashed var(--border-color);
        position relative
        &:hover {
          .date {
            color $accentColor
            &::before {
              background $accentColor
            }
          }
          .title {
            color $accentColor
          }
        }
        .date {
          width 40px
          line-height 30px
          color var(--text-color-sub)
          font-size 12px
          &::before {
            content: " ";
            position: absolute;
            left: -18px;
            top: 41px;
            width: 6px;
            height: 6px;
            margin-left: -4px;
            background: var(--background-color);
            border-radius: 50%;
            border: 1px solid var(--border-color);
            z-index 2
          }
        }
        .title {
          line-height 30px
          color var(--text-color-sub)
          font-size 16px
          cursor pointer
        }
      }
    }
@media (max-width: $MQMobile)
  .timeline-wrapper
    margin: 0;
    padding: 2rem 2rem 0;
</style>
