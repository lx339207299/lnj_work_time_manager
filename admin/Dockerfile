# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# tsc 不需要大内存，用默认限制
RUN npx tsc -b

# vite 打包限制 768MB 堆内存
ENV NODE_OPTIONS=--max-old-space-size=768
RUN npx vite build

# Serve stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
