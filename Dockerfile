FROM node:18 as builder

WORKDIR /app

COPY docs/ ./
COPY docs/package*.json ./

RUN npm ci

RUN ls -la /app/
RUN ls -la /app/.vitepress/
RUN ls -la /app/.vitepress/theme
RUN npx vitepress build

FROM nginx:1.21

COPY --from=builder /app/.vitepress/dist /usr/share/nginx/html
COPY nginx-custom.conf /etc/nginx/conf.d/default.conf
