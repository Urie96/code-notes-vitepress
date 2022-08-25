<template>
  <div class="home-blog">
    <div class="hero" :style="{ ...bgImageStyle }">
      <div>
        <ModuleTransition>
          <img
            class="hero-img"
            v-if="recoShowModule && frontmatter.heroImage"
            :style="frontmatter.value.heroImageStyle || {}"
            :src="withBase(frontmatter.heroImage)"
            alt="hero"
          />
        </ModuleTransition>

        <ModuleTransition delay="0.04">
          <h1 v-if="recoShowModule">Young's Code Notes</h1>
        </ModuleTransition>

        <ModuleTransition delay="0.08">
          <p v-if="recoShowModule" class="description">
            A ship in harbor is safe, but that is not what ships are built for
          </p>
        </ModuleTransition>
      </div>
    </div>

    <ModuleTransition delay="0.16">
      <div v-show="recoShowModule" class="home-blog-wrapper">
        <div class="blog-list">
          <!-- 博客列表 -->
          <NoteAbstract
            :data="theme.pageData.pages"
            @paginationChange="paginationChange"
          />
        </div>
        <div class="info-wrapper">
          <PersonalInfo />
          <h4><reco-icon icon="reco-category" /> 分类</h4>
          <ul class="category-wrapper">
            <li
              class="category-item"
              v-for="(item, index) in theme.pageData.categories"
              :key="item.name"
            >
              <a @click="router.go('/categories?category=' + item.name)">
                <span class="category-name">{{ item.name }}</span>
                <span
                  class="post-num"
                  :style="{ backgroundColor: getOneColor() }"
                >
                  {{ item.num }}
                </span>
              </a>
            </li>
          </ul>
          <hr />
          <h4 v-if="theme.pageData.tags"><reco-icon icon="reco-tag" /> 标签</h4>
          <TagList :tags="theme.pageData.tags" />
        </div>
      </div>
    </ModuleTransition>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, ref } from 'vue';
import { useData, withBase, useRouter } from 'vitepress';
import { getOneColor } from '../utils';
import NoteAbstract from './NoteAbstract.vue';
import PersonalInfo from './PersonalInfo.vue';
import TagList from './TagList.vue';

const router = useRouter();

const recoShowModule = ref(false);

const { frontmatter, theme } = useData();
const state = reactive({
  recoShow: false,
  heroHeight: 0,
});

const bgImageStyle = {
  textAlign: 'center',
  overflow: 'hidden',
  background: `url(/bg.svg) center/cover no-repeat`,
  height: 'calc(60vh)',
};

onMounted(() => {
  state.heroHeight = document.querySelector('.hero')!.clientHeight;
  state.recoShow = true;
  recoShowModule.value = true;
});

const paginationChange = () => {
  setTimeout(() => {
    window.scrollTo(0, state.heroHeight);
  }, 100);
};
</script>

<style lang="stylus">
@require '../styles/variable.styl'

@font-face
  font-family: Italianno
  font-style: normal
  font-weight: 400
  font-display: swap
  src: url(https://fonts.gstatic.com/s/italianno/v10/dg4n_p3sv6gCJkwzT6RXiJwoYQAugw.woff2) format('woff2')
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD

.home-blog
    margin-bottom: 4em !important
    .hero
        & > div
            & > h1
                font 4rem fantasy
            & > p.description
                font 2.5rem Italianno, cursive

h1, h2, h3, h4, h5, h6
  font-weight: 500;
  line-height: 1.25;
h4
  margin 1.33em 0
a
  font-weight: 500;
  text-decoration: none;
ul
  list-style-type: disc;

.home-blog {
  padding: 0;
  margin: 0px auto;
  .hero {
    position relative
    box-sizing border-box
    padding 0 20px
    height 100vh
    display flex
    align-items center
    justify-content center
    .hero-img {
      max-width: 300px;
      margin: 0 auto 1.5rem
    }

    h1 {
      display: block;
      margin:0 auto 1.8rem;
      font-size: 2.5rem;
    }

    .description {
      margin: 1.8rem auto;
      font-size: 1.6rem;
      line-height: 1.3;
    }
  }
  .home-blog-wrapper {
    display flex
    align-items: flex-start;
    margin 20px auto 0
    padding 0 20px
    max-width $homePageWidth
    .blog-list {
      flex auto
      width 0
      .abstract-wrapper {
        .abstract-item:last-child {
          margin-bottom: 0px;
        }
      }
    }
    .info-wrapper {
      position -webkit-sticky;
      position sticky;
      top 70px
      overflow hidden
      transition all .3s
      margin-left 15px
      flex 0 0 300px
      height auto
      box-shadow var(--box-shadow)
      border-radius $borderRadius
      box-sizing border-box
      padding 0 15px
      background var(--background-color)
      &:hover {
        box-shadow var(--box-shadow-hover)
      }
      h1, h2, h3, h4, h5, h6 {
        font-weight: 500;
        line-height: 1.25;
      }
      h4 {
        margin 1.33em 0
        color var(--text-color)
      }
      .category-wrapper {
        list-style none
        padding-left 0
        .category-item {
          margin-bottom .4rem
          padding: .4rem .8rem;
          transition: all .5s
          border-radius $borderRadius
          box-shadow var(--box-shadow)
          background-color var(--background-color)
          &:hover {
            transform scale(1.04)
            a {
              color $accentColor
            }
          }
          a {
            display flex
            justify-content: space-between
            align-items: center
            color var(--text-color)
            .post-num {
              width 1.6rem;
              height 1.6rem
              text-align center
              line-height 1.6rem
              border-radius $borderRadius
              background #eee
              font-size 13px
              color #fff
            }
          }
        }
      }
    }
  }
}

@media (max-width: $MQMobile) {
  .home-blog {
    .hero {
      height 450px
      img {
        max-height: 210px;
        margin: 2rem auto 1.2rem;
      }

      h1 {
        margin: 0 auto 1.8rem ;
        font-size: 2rem;
      }

      .description {
        font-size: 1.2rem;
      }

      .action-button {
        font-size: 1rem;
        padding: 0.6rem 1.2rem;
      }
    }
    .home-blog-wrapper {
      display block!important
      .blog-list {
        width auto
      }
      .info-wrapper {
        // display none!important
        margin-left 0
        .personal-info-wrapper {
          display none
        }
      }
    }
  }
}

@media (max-width: $MQMobileNarrow) {
  .home-blog {
    .hero {
      height 450px
      img {
        max-height: 210px;
        margin: 2rem auto 1.2rem;
      }

      h1 {
        margin: 0 auto 1.8rem ;
        font-size: 2rem;
      }

      h1, .description, .action {
        // margin: 1.2rem auto;
      }

      .description {
        font-size: 1.2rem;
      }

      .action-button {
        font-size: 1rem;
        padding: 0.6rem 1.2rem;
      }
    }

    .home-blog-wrapper {
      display block!important
      .blog-list {
        width auto
      }
      .info-wrapper {
        // display none!important
        margin-left 0
        .personal-info-wrapper {
          display none
        }
      }
    }
  }
}
</style>
