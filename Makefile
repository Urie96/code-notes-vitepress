.PHONY: image

image:
	yarn build
	yarn sw
	yarn zip
	docker build -t hub.lubui.com/code-notes-vitepress .
	docker push hub.lubui.com/code-notes-vitepress

search:
	node docs/.vitepress/gen-docsearch-config.mjs|tee /tmp/config.json
	cd /home/ubuntu/workplace/py/docsearch-scraper && pipenv run ./docsearch run /tmp/config.json