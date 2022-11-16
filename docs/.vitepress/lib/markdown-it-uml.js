import deflate from './deflate';
import fetch from './cache-fetch.js';
import svgToUri from 'mini-svg-data-uri';
import { optimize } from 'svgo';

export default (md) => {
    const temp = md.renderer.rules.fence.bind(md.renderer.rules);
    md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
        const token = tokens[idx];
        const code = token.content.trim();
        if (token.info === 'plantuml') {
            return plant2HTML(code);
        }
        if (token.info === 'mermaid') {
            return mermaid2HTML(code);
        }
        return temp(tokens, idx, options, env, slf);
    };
};

const mermaid2HTML = (code) => {
    console.log(code);
    try {
        const darkPayload = Buffer.from(
            `\n%%{init:{'theme':'dark'}}%%\n\n${code}\n`.trim(),
        ).toString('base64');
        const lightPayload = Buffer.from(
            `\n%%{init:{'theme':'default'}}%%\n\n${code}\n`.trim(),
        ).toString('base64');
        console.log(`https://mermaid.ink/svg/${darkPayload}`);
        return (
            url2html(`https://mermaid.ink/svg/${darkPayload}`, 'only-dark') +
            url2html(`https://mermaid.ink/svg/${lightPayload}`, 'only-light')
        );
    } catch (error) {
        console.log(error);
    }
};

const plant2HTML = (code) => {
    const diagramName = 'uml';
    var zippedCode = deflate.encode64(
        deflate.zip_deflate(
            unescape(
                encodeURIComponent(
                    `@start${diagramName}\nskinparam backgroundColor transparent\n${code.trim()}\n@end${diagramName}`,
                ),
            ),
            9,
        ),
    );
    return (
        url2html(
            `https://www.plantuml.com/plantuml/svg/${zippedCode}`,
            'uml only-light',
        ) +
        url2html(
            `https://www.plantuml.com/plantuml/dsvg/${zippedCode}`,
            'uml only-dark',
        )
    );
};

const url2html = (url, clazz) => {
    const res = fetch(url);
    if (res) {
        const { data } = optimize(res);
        return `<img class="${clazz}" src="${svgToUri(data)}">`;
    }
    return `<img class="${clazz}" src="${url}">`;
};
