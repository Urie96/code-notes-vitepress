export default (md) => {
  const temp = md.renderer.rules.fence.bind(md.renderer.rules)
  md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
    const token = tokens[idx]
    const code = token.content.trim()
    if (token.info === 'mermaid') {
      return toMermaidHTML(code)
    }
    const firstLine = code.split(/\n/)[0].trim()
    if (firstLine === 'gantt' || firstLine === 'sequenceDiagram' || firstLine.match(/^graph (?:TB|BT|RL|LR|TD);?$/)) {
      return toMermaidHTML(code)
    }
    return temp(tokens, idx, options, env, slf)
  }
}

const toMermaidHTML = (code) => {
  const darkPayload = btoa(`\n%%{init:{'theme':'dark'}}%%\n\n${code}\n`.trim())
  const lightPayload = btoa(`\n%%{init:{'theme':'default'}}%%\n\n${code}\n`.trim())
  return `<img class="uml only-dark" src="https://mermaid.ink/svg/${darkPayload}"><img class="uml only-light" src="https://mermaid.ink/svg/${lightPayload}">`
}