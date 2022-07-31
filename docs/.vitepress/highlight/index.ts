import { IThemeRegistration, getHighlighter } from 'shiki'
import { ThemeOptions } from 'vitepress';
import httpGrammar from './http.json'

export async function highlight(theme: ThemeOptions) {
    const hasSingleTheme = typeof theme === 'string' || 'name' in theme
    const getThemeName = (themeValue: IThemeRegistration) =>
        typeof themeValue === 'string' ? themeValue : themeValue.name

    const highlighter = await getHighlighter({
        themes: hasSingleTheme ? [theme] : [theme.dark, theme.light]
    })
    const _httpGrammer: any = httpGrammar
    await highlighter.loadLanguage({
        id: "http",
        scopeName: 'source.http',
        grammar: _httpGrammer,
    })
    const preRE = /^<pre.*?>/
    const vueRE = /-vue$/
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="54" height="14" viewBox="0 0 54 14"><g fill="none" fill-rule="evenodd" transform="translate(1 1)"><circle cx="6" cy="6" r="6" fill="#FF5F56" stroke="#E0443E" stroke-width=".5"></circle><circle cx="26" cy="6" r="6" fill="#FFBD2E" stroke="#DEA123" stroke-width=".5"></circle><circle cx="46" cy="6" r="6" fill="#27C93F" stroke="#1AAB29" stroke-width=".5"></circle></g></svg>`

    return (str: string, lang: string) => {
        const vPre = vueRE.test(lang) ? '' : 'v-pre'
        lang = lang.replace(vueRE, '').toLowerCase()

        let highlighted = ""

        if (hasSingleTheme) {
            highlighted = highlighter
                .codeToHtml(str, { lang, theme: getThemeName(theme) })
                .replace(preRE, `<pre ${vPre}>`)
        } else {
            const dark = highlighter
                .codeToHtml(str, { lang, theme: getThemeName(theme.dark) })
                .replace(preRE, `<pre ${vPre} class="vp-code-dark">`)

            const light = highlighter
                .codeToHtml(str, { lang, theme: getThemeName(theme.light) })
                .replace(preRE, `<pre ${vPre} class="vp-code-light">`)

            highlighted = dark + light
        }
        if (lang === 'zsh') {
            // highlighted = `<pre class="zsh-window">${svg}${highlighted}</pre>`
        }
        return highlighted
    }
}
