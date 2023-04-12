import { getHighlighter } from 'shiki';
import httpGrammar from './http_grammer.json';
import zshGrammer from './zsh_grammer.json';
import zshTheme from './zsh_theme.json';

export async function highlight() {
    const theme = 'dark-plus';
    let highlighter = await getHighlighter({ theme });

    const shikiTheme = highlighter.getTheme(theme);
    shikiTheme.settings.push(...zshTheme);

    highlighter = await getHighlighter({
        themes: [shikiTheme],
    });
    const _httpGrammer = httpGrammar;
    await highlighter.loadLanguage({
        id: 'http',
        scopeName: 'source.http',
        grammar: _httpGrammer,
    });
    const _zshGrammer = zshGrammer;
    await highlighter.loadLanguage({
        id: 'zsh',
        scopeName: 'source.zsh',
        grammar: _zshGrammer,
    });

    const preRE = /^<pre.*?>/;
    const vueRE = /-vue$/;
    // const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="54" height="14" viewBox="0 0 54 14"><g fill="none" fill-rule="evenodd" transform="translate(1 1)"><circle cx="6" cy="6" r="6" fill="#FF5F56" stroke="#E0443E" stroke-width=".5"></circle><circle cx="26" cy="6" r="6" fill="#FFBD2E" stroke="#DEA123" stroke-width=".5"></circle><circle cx="46" cy="6" r="6" fill="#27C93F" stroke="#1AAB29" stroke-width=".5"></circle></g></svg>`

    return (str: string, lang: string) => {
        const vPre = vueRE.test(lang) ? '' : 'v-pre';
        lang = lang.replace(vueRE, '').toLowerCase();

        if (lang === 'zsh') {
            str = str.replaceAll(/(?<=\n|^)\s*\$/g, '❯');
        }
        return highlighter
            .codeToHtml(str, { lang, theme })
            .replace(preRE, `<pre ${vPre}>`);
    };
}
