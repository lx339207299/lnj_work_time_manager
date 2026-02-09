FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
ARG TARO_APP_API_URL
ENV TARO_APP_API_URL=${TARO_APP_API_URL}
RUN echo "Building with API_URL=${TARO_APP_API_URL}"
RUN npm run build:h5

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
