.PHONY: image

image:
	# yarn build
	yarn sw
	node docs/.vitepress/gen-sitemap.mjs
	yarn zip
	docker build -t hub.lubui.com/code-notes-vitepress .
	docker push hub.lubui.com/code-notes-vitepress

search:
	node docs/.vitepress/gen-docsearch-config.mjs|tee /tmp/config.json
	cd /home/ubuntu/workplace/py/docsearch-scraper && pipenv run ./docsearch run /tmp/config.json

upload:
	yarn build
	yarn sw
	qshell qupload2 --src-dir=/home/ubuntu/workplace/js/code-notes-vitepress/dist --thread-count=10 --overwrite --bucket=lubui-com