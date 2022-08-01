import { defineConfig } from 'vitepress';
import Token from 'markdown-it/lib/token'
import container from 'markdown-it-container'
import fs from 'fs';
import fm from 'front-matter';
import { highlight } from './highlight';

export default async () => {
    const highlighter = await highlight('dark-plus')
    return defineConfig({
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
            highlight: highlighter,
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
            siteTitle: '杨氏笔记',
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
            sidebar: sidebar(),
            nav: [
                { text: 'vuepress版本', link: 'https://lubui.com' },
            ]
        }
    })


}



function sidebar() {
    const sidebars: any = []
    const root = './docs/'
    fs.readdirSync(root, { withFileTypes: true }).forEach(dir => {
        if (dir.isDirectory()) {
            const dirPath = root + dir.name
            const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.md'))
            const items = files.map(file => {
                const fileName = file.replace('.md', '')
                const { attributes }: any = fm(fs.readFileSync(dirPath + '/' + file, 'utf8'))
                return {
                    text: attributes.title || fileName,
                    link: '/' + dir.name + '/' + fileName,
                    date: Date.parse(attributes.date)
                }
            }).sort((a, b) => a.date - b.date)
            if (items.length) {
                sidebars.push({
                    text: dir.name,
                    items: items
                })
            }
        }
    })
    return sidebars
}