const { getHighlighter } = require('shiki');
const fs = require('fs');
const grammer = require('./zsh_grammer.json');
const zshTheme = require('./zsh_theme.json');

async function main() {
  let highlighter = await getHighlighter({
    theme: 'dark-plus'
  })

  const darkPlus = highlighter.getTheme('dark-plus')
  darkPlus.settings.push(...zshTheme)

  highlighter = await getHighlighter({
    themes: [darkPlus]
  })

  await highlighter.loadLanguage({
    id: "zsh",
    scopeName: 'source.zsh',
    grammar: grammer,
  })

  const code = `$ (MODE=dev cd ~/workplace && find . -type f -name "*.sh" \
  --exec sh -c "echo {}") \
  && echo "current workplace is: \`pwd\`" \
  || grep "$SHELL" | awk '{print $9}' > a.txt &
  {"jsonrpc":"2.0","id": 1,"result": "0x60806040523..."}
  ^C
   `

  const res = highlighter.codeToHtml(code.replace(/^\$/, '❯'), { lang: 'zsh' })

  fs.writeFileSync('index.html', `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
  </head>
  <body>
    ${res}
  </body>
  </html>`)

}


main()