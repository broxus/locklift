FROM node:18 AS builder

WORKDIR /app

COPY docs/ .

RUN npm install --force
RUN npx vitepress build

FROM nginx:1.21

COPY --from=builder /app/.vitepress/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-custom.conf /etc/nginx/conf.d/default.conf

RUN mkdir -p /tmp/nginx/client_temp /tmp/nginx/proxy_temp /tmp/nginx/fastcgi_temp /tmp/nginx/uwsgi_temp /tmp/nginx/scgi_temp \
    && chown -R 10001:10001 /usr/share/nginx/html /var/cache/nginx /etc/nginx /tmp/nginx

USER 10001:10001
