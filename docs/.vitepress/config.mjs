import { defineConfig, createMarkdownRenderer } from "vitepress";
import container from "markdown-it-container";
import uml from "./lib/markdown-it-uml";
import matter from "gray-matter";
import fg from "fast-glob";
import zshGrammar from "./shiki_custom/zsh_grammar.json";
// import darkPlus from 'tm-themes/themes/dark-plus.json' assert { type: 'json' };

// https://vitepress.dev/reference/site-config
export default async () => {
  const pageData = await getPageData();

  return defineConfig({
    outDir: "../dist",
    title: "我的笔记",
    description: " ",
    lang: "zh-CN",
    lastUpdated: true,
    markdown: {
      math: true,
      theme: {
        light: "vitesse-light",
        dark: "vitesse-dark",
      },
      config: (md) => {
        useContainer(md);
        md.use(uml);
      },
      shikiSetup: async (shiki) => {
        await shiki.loadLanguage(zshGrammar);
      },
      codeTransformers: [
        {
          preprocess(code, options) {
            if (options.lang === "terminal") {
              return code.replaceAll(/(?<=\n|^)\s*\$/g, "❯");
            }
          },
        },
      ],
    },
    head: [
      ["link", { rel: "icon", href: "/favicon.svg" }],
      ["link", { rel: "manifest", href: "/manifest.json" }],
      ["meta", { name: "theme-color", content: "#3eaf7c" }],
      ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
      [
        "meta",
        {
          name: "apple-mobile-web-app-status-bar-style",
          content: "black",
        },
      ],
      ["link", { rel: "apple-touch-icon", href: "/favicon.svg" }],
      ["link", { rel: "mask-icon", href: "/favicon.svg", color: "#3eaf7c" }],
      ["meta", { name: "msapplication-TileImage", content: "/favicon.svg" }],
      ["meta", { name: "msapplication-TileColor", content: "#000000" }],
      [
        "script",
        {
          async: "",
          defer: "",
          "data-website-id": "3d93c0c0-7211-47c5-a528-ff49e6760859",
          src: "https://umami.lubui.com:8443/script.js",
        },
      ],
    ],
    themeConfig: {
      author: "杨锐",
      authorAvatar: "/avatar.svg",
      siteTitle: "我的笔记",
      logo: "/favicon.svg",
      lastUpdatedText: "最近更新于",
      outline: {
        level: [2, 3, 4],
        label: "本页目录",
      },
      socialLinks: [
        {
          icon: "github",
          link: "https://github.com/Urie96",
        },
      ],
      editLink: {
        pattern:
          "https://github.com/Urie96/code-notes-vitepress/edit/main/docs/:path",
        text: "编辑此页",
      },
      docFooter: {
        prev: "上一篇",
        next: "下一篇",
      },
      footer: {
        message:
          '<a href="https://beian.miit.gov.cn" target="_blank">蜀ICP备20013653号-2</a>',
        copyright: "",
      },
      personalInfoSocialLinks: [
        { icon: "reco-github", link: "https://github.com/Urie96" },
        { icon: "reco-mail", link: "mailto:urie@mail.ustc.edu.cn" },
        {
          icon: "reco-wechat",
          link: "https://s7.addthis.com/static/wechat_follow.html?id=yangrui19960623&u=https://u.wechat.com/EMKvZ_5c_yuQ6j2qDeyJ5J8",
        },
      ],
      search: {
        provider: "local",
        options: {
          translations: {
            button: {
              buttonText: "搜索文档",
              buttonAriaLabel: "搜索文档",
            },
            modal: {
              noResultsText: "无法找到相关结果",
              resetButtonTitle: "清除查询条件",
              footer: {
                selectText: "选择",
                navigateText: "切换",
              },
            },
          },
        },
      },

      sidebar: getSidebar(pageData.pages),
      pageData: pageData,
      nav: [
        { text: "主页", link: "/" },
        {
          text: "分类",
          items: pageData.categories.map((v) => ({
            text: v.name,
            link: `/categories/#${v.name}`,
          })),
          activeMatch: "/categories/.*",
        },
        { text: "标签", link: "/tags/" },
        { text: "时间线", link: "/timeline/" },
        {
          text: "我的网页",
          items: [
            { text: "HackBook", link: "https://book.lubui.com" },
            //{
            //  text: '美好的回忆',
            //  link: 'https://immich.lubui.com:8443',
            //},
            {
              text: "家庭服务",
              link: "https://home.lubui.com:8443",
            },
            {
              text: "在一起纪念",
              link: "https://huyue.lubui.com",
            },
          ],
        },
      ],
      valineConfig: {
        appId: "fSNwRSMOQpKoQRjh445uVuRd-gzGzoHsz",
        appKey: "3JI5UOTHspBwX1DC91nx6rbW",
        placeholder: "这里可以直接发评论哦～",
        lang: "zh",
      },
    },
  });
};

function getSidebar(pages) {
  const categories = {};

  for (const v of pages) {
    const sideBarItem = {
      text: v.title || "未命名文件",
      link: v.link,
      date: v.date,
      sort: v.sort,
    };
    if (v.categories) {
      for (const cate of v.categories) {
        categories[cate] = categories[cate] || [];
        categories[cate].push(sideBarItem);
      }
    }
  }

  const sidebars = [];
  for (const cate in categories) {
    sidebars.push({
      text: cate,
      items: categories[cate].sort(
        (a, b) => a.sort - b.sort || b.date - a.date,
      ),
    });
  }
  sidebars.sort((a, b) => b.items[0].date - a.items[0].date);
  return sidebars;
}

function useContainer(md) {
  return md
    .use(container, "row", {
      render: (tokens, idx) =>
        tokens[idx].nesting === 1
          ? `<div class="custom-block row">\n`
          : "</div>\n",
    })
    .use(container, "abstract", {
      render: (tokens, idx) =>
        tokens[idx].nesting === 1
          ? `<div class="custom-block-abstract tip vp-doc">\n`
          : "</div>\n",
    });
}

async function getPageData() {
  const filePathList = await fg("./docs/**/*.md");
  const getLink = (str) => {
    return str.substring("./docs".length, str.length - ".md".length);
  };

  const cwd = process.cwd();
  const md = await createMarkdownRenderer(cwd);
  useContainer(md);

  const pages = [];
  for (const filePath of filePathList) {
    const mdFile = matter.read(filePath, {
      excerpt: true,
      excerpt_separator: "<!-- more -->",
    });
    if (mdFile.data.layout === "page" || mdFile.data.disable === true) {
      continue;
    }
    pages.push({
      sort: 1 << 30,
      categories: [],
      tags: [],
      ...mdFile.data,
      link: getLink(filePath),
      date: Date.parse(mdFile.data.date),
      excerpt: md.render(mdFile.excerpt || ""),
    });
  }

  pages.sort((a, b) => b.date - a.date);

  const categories = [];
  const tags = [];

  for (const v of pages) {
    for (const cateName of v.categories) {
      const category = categories.filter((v) => v.name === cateName)?.[0];
      if (category) {
        category.num++;
      } else {
        categories.push({
          name: cateName,
          num: 1,
        });
      }
    }

    for (const tagName of v.tags) {
      const tag = tags.filter((v) => v.name === tagName)?.[0];
      if (tag) {
        tag.num++;
      } else {
        tags.push({
          name: tagName,
          num: 1,
        });
      }
    }
  }

  return { categories, tags, pages };
}

function algolia() {
  return {
    appId: "EWJHIHWDFQ",
    apiKey: "db89e85da0a58d7078b240288ca7e81d",
    indexName: "code_notes",
    placeholder: "搜索文档",
  };
}
