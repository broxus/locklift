
FROM node:18 as builder

WORKDIR /app

COPY docs/ .

RUN npm install --force
RUN npx vitepress build

FROM nginx:1.21

COPY --from=builder /app/.vitepress/dist /usr/share/nginx/html
COPY nginx-custom.conf /etc/nginx/conf.d/default.conf
