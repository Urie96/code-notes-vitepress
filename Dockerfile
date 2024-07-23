# FROM hub.lubui.com/nginx-brotli:alpine
FROM nginx:alpine
COPY ./dist /root
COPY ./nginx.conf /etc/nginx/
