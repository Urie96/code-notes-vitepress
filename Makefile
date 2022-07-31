.PHONY: image

image:
	yarn build
	yarn sw
	yarn zip
	docker build -t hub.lubui.com/code-notes-vitepress .
	docker push hub.lubui.com/code-notes-vitepress