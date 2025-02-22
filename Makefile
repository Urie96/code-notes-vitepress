.PHONY: image

build:
	bun run build
	cd ./dist && fd -e js -e css -e html -e svg -e json -e cast -e txt --size +10k | xargs gzip --best -k

image:
	# bun run sw
	# bun docs/.vitepress/gen-sitemap.mjs
	docker build -t hub.lubui.com/code-notes-vitepress .
	docker push hub.lubui.com/code-notes-vitepress

deploy: image
	ssh lubui.com sudo kubectl scale --replicas=0 deployment code-notes-vitepress
	ssh lubui.com sudo kubectl scale --replicas=1 deployment code-notes-vitepress

search:
	node docs/.vitepress/gen-docsearch-config.mjs|tee /tmp/config.json
	cd /home/ubuntu/workplace/py/docsearch-scraper && pipenv run ./docsearch run /tmp/config.json

upload:
	# bun run build
	# bun run sw
	# coscmd -c ~/.config/tencent-cloud/.cos.conf -b webpage-1308451905 -r ap-beijing upload -r /dist code-notes
	# qshell qupload2 --src-dir=./dist --thread-count=10 --overwrite --bucket=lubui-code-notes
	# echo https://huyue.lubui.com/index.html >._list
	# qshell cdnrefresh -i ._list
	# rm ._list
	rm -rf /var/lib/nginx/static/code-notes/*
	cp -r ./dist/* /var/lib/nginx/static/code-notes/
