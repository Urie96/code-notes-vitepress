.PHONY: image

image:
	pnpm build
	pnpm sw
	node docs/.vitepress/gen-sitemap.mjs
	pnpm zip
	docker build -t hub.lubui.com/code-notes-vitepress .
	docker push hub.lubui.com/code-notes-vitepress

deploy: image
	ssh lubui.com sudo kubectl scale --replicas=0 deployment code-notes-vitepress
	ssh lubui.com sudo kubectl scale --replicas=1 deployment code-notes-vitepress

search:
	node docs/.vitepress/gen-docsearch-config.mjs|tee /tmp/config.json
	cd /home/ubuntu/workplace/py/docsearch-scraper && pipenv run ./docsearch run /tmp/config.json

upload:
	pnpm build
	pnpm sw
	qshell qupload2 --src-dir=/home/ubuntu/workplace/js/code-notes-vitepress/dist --thread-count=10 --overwrite --bucket=lubui-com