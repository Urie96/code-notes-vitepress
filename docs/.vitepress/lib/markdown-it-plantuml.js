import deflate from './deflate';

export default (md) => {
  const temp = md.renderer.rules.fence.bind(md.renderer.rules)
  md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
    const token = tokens[idx]
    const code = token.content.trim()
    if (token.info === 'plantuml') {
      return toMermaidHTML(code)
    }
    return temp(tokens, idx, options, env, slf)
  }
}

const toMermaidHTML = (code) => {
  const diagramName = 'uml';
  var zippedCode = deflate.encode64(
    deflate.zip_deflate(
      unescape(encodeURIComponent(
        '@start' + diagramName + '\nskinparam backgroundColor transparent\n' + code.trim() + '\n@end' + diagramName)),
      9
    )
  );
  return `<img class="uml only-dark" src="https://www.plantuml.com/plantuml/dsvg/${zippedCode}"><img class="uml only-light" src="https://www.plantuml.com/plantuml/svg/${zippedCode}">`
}