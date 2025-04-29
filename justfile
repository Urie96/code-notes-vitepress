alias b := build
alias d := deploy
alias p := preview

build:
    bun run build
    cd ./dist && fd -e js -e css -e html -e svg -e json -e cast -e txt --size +10k | xargs gzip --best -k

deploy:
    rm -rf /var/lib/nginx/static/code-notes/*
    cp -r ./dist/* /var/lib/nginx/static/code-notes/

preview:
    bun run dev

image:
    # bun run sw
    # bun docs/.vitepress/gen-sitemap.mjs
    docker build -t hub.lubui.com/code-notes-vitepress .
    docker push hub.lubui.com/code-notes-vitepress

search:
    node docs/.vitepress/gen-docsearch-config.mjs|tee /tmp/config.json
    cd /home/ubuntu/workplace/py/docsearch-scraper && pipenv run ./docsearch run /tmp/config.json
