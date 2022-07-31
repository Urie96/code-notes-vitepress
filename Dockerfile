FROM hub.lubui.com/nginx-brotli:alpine
COPY ./dist /root
COPY ./nginx.conf /etc/nginx/