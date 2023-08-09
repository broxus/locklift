
FROM node:18 as builder

WORKDIR /app

COPY docs/package*.json ./

RUN npm ci

RUN npx vitepress build

RUN ls -la /app/.vitepress/dist

FROM nginx:1.21

COPY --from=builder /app/.vitepress/dist /usr/share/nginx/html
COPY nginx-custom.conf /etc/nginx/conf.d/default.conf
