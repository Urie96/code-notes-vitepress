import { UserConfig, DefaultTheme, createMarkdownRenderer } from 'vitepress';
import Token from 'markdown-it/lib/token'
import container from 'markdown-it-container'
import matter from 'gray-matter';
import fg from 'fast-glob';
import { highlight } from './highlight';

export default async () => {
    const pageData = await getPageData()
    return {
        outDir: '../dist',
        title: 'LUBUI',
        description: ' ',
        lang: 'zh-CN',
        lastUpdated: true,
        markdown: {
            theme: 'dark-plus',
            config: (md) => {
                useContainer(md)
            },
            highlight: (await highlight('dark-plus')),
        },
        // ignoreDeadLinks: true,
        head: [
            ['link', { rel: 'icon', href: '/favicon.svg' }],
            ['link', { rel: 'manifest', href: '/manifest.json' }],
            ['meta', { name: 'theme-color', content: '#3eaf7c' }],
            ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
            ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
            ['link', { rel: 'apple-touch-icon', href: '/favicon.svg' }],
            ['link', { rel: 'mask-icon', href: '/favicon.svg', color: '#3eaf7c' }],
            ['meta', { name: 'msapplication-TileImage', content: '/favicon.svg' }],
            ['meta', { name: 'msapplication-TileColor', content: '#000000' }],
        ],
        themeConfig: {
            author: '杨锐',
            authorAvatar: '/avatar.svg',
            siteTitle: 'LUBUI',
            logo: '/favicon.svg',
            lastUpdatedText: '最近更新于',
            outlineTitle: '本页目录',
            socialLinks: [
                {
                    icon: 'github',
                    link: 'https://github.com/Urie96'
                }
            ],
            personalInfoSocialLinks: [
                { icon: 'reco-github', link: 'https://github.com/Urie96' },
                { icon: 'reco-mail', link: 'mailto:urie@mail.ustc.edu.cn' },
                { icon: 'reco-wechat', link: 'https://s7.addthis.com/static/wechat_follow.html?id=yangrui19960623&u=https://u.wechat.com/EMKvZ_5c_yuQ6j2qDeyJ5J8' },
            ],
            algolia: {
                appId: 'EWJHIHWDFQ',
                apiKey: 'db89e85da0a58d7078b240288ca7e81d',
                indexName: 'code_notes'
            },
            sidebar: getSidebar(pageData.pages),
            pageData: pageData,
            nav: [
                { text: '分类', items: pageData.categories.map((v: any) => ({ text: v.name, link: `/categories/?category=${v.name}` })) },
                { text: '标签', link: '/tags/' },
                { text: '时间线', link: '/timeline/' },
                {
                    text: '我的网页', items: [
                        { text: '老版笔记', link: 'https://old.lubui.com' },
                        { text: 'HackBook', link: 'https://book.lubui.com' },
                        { text: '美好回忆', link: 'http://cro.cab:2342' },
                        { text: '在一起计时器', link: 'https://huyue.sweetlove.top' },
                        { text: '悦娃的工具', link: 'https://yue.lubui.com' },
                    ]
                }
            ]
        }
    } as UserConfig<DefaultTheme.Config>
}



function getSidebar(pages: any) {
    const categories: any = {};

    pages.forEach((v: any) => {
        const sideBarItem = {
            text: v.title || '未命名文件',
            link: v.link,
            date: v.date,
        };
        (v.categories || []).forEach((cate: any) => {
            categories[cate] = categories[cate] || []
            categories[cate].push(sideBarItem)
        });
    })
    const sidebars: any = [];
    for (const cate in categories) {
        sidebars.push({
            text: cate,
            items: categories[cate].sort((a: any, b: any) => b.date - a.date)
        })
    }
    sidebars.sort((a: any, b: any) => b.items[0].date - a.items[0].date)
    return sidebars
}

function useContainer(md: any) {
    return md.use(container, 'row', {
        render: (tokens: Token[], idx: number) =>
            tokens[idx].nesting === 1 ? `<div class="custom-block row">\n` : `</div>\n`
    }).use(container, 'abstract', {
        render: (tokens: Token[], idx: number) =>
            tokens[idx].nesting === 1 ? `<div class="custom-block-abstract tip">\n` : `</div>\n`
    })
}

async function getPageData() {
    const filePathList = await fg('./docs/**/*.md')
    const getLink = (str: string) => {
        return str.substring('./docs'.length, str.length - '.md'.length)
    }

    const cwd = process.cwd()
    const md = await createMarkdownRenderer(cwd)
    useContainer(md)

    const pages = filePathList.map(filePath => {
        const mdFile = matter.read(filePath, { excerpt: true, excerpt_separator: '<!-- more -->' })
        if (mdFile.data.layout === 'page') {
            return
        }
        return {
            categories: [],
            tags: [],
            ...mdFile.data,
            link: getLink(filePath),
            date: Date.parse(mdFile.data.date),
            excerpt: md.render(mdFile.excerpt!),
        }
    }).filter(v => v).sort((a: any, b: any) => b.date - a.date);

    const categories: any = []
    const tags: any = []

    pages.forEach((v: any) => {
        v.categories.forEach((cateName: string) => {
            const category = categories.filter((v: any) => v.name === cateName)?.[0]
            if (category) {
                category.num++
            } else {
                categories.push({
                    name: cateName,
                    num: 1
                })
            }
        });
        v.tags.forEach((tagName: string) => {
            const tag = tags.filter((v: any) => v.name === tagName)?.[0]
            if (tag) {
                tag.num++
            } else {
                tags.push({
                    name: tagName,
                    num: 1
                })
            }
        });
    })

    return { categories, tags, pages }
}