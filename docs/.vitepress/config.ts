import { UserConfig, DefaultTheme } from 'vitepress';
import Token from 'markdown-it/lib/token'
import container from 'markdown-it-container'
import fs from 'fs';
import fm from 'front-matter';
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
                md.use(container, 'row', {
                    render: (tokens: Token[], idx: number) =>
                        tokens[idx].nesting === 1 ? `<div class="custom-block row">\n` : `</div>\n`
                })
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
                { text: '老版本', link: 'https://lubui.com' },
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

async function getPageData() {
    const filePathList = await fg('./docs/**/*.md')
    const getLink = (str: string) => {
        return str.substring('./docs'.length, str.length - '.md'.length)
    }
    const pages = filePathList.map(filePath => {
        const { attributes }: any = fm(fs.readFileSync(filePath, 'utf8'))
        if (attributes.layout === 'page') {
            return
        }
        return {
            categories: [],
            tags: [],
            ...attributes,
            link: getLink(filePath),
            date: Date.parse(attributes.date)
        }
    }).filter(v => v).sort((a, b) => b.date - a.date);

    const categories: any = []
    const tags: any = []

    pages.forEach(v => {
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