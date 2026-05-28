FROM node:20 AS build
WORKDIR /app

# 安装 openssl（先换阿里云源，境内加速）
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update && apt-get install -y openssl

COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# ── 最终镜像 ──
FROM node:20
WORKDIR /app

# 从 build 阶段复制 openssl 动态库（省去 7 分钟 apt-get）
COPY --from=build /usr/lib/x86_64-linux-gnu/libssl.so.3 /usr/lib/x86_64-linux-gnu/
COPY --from=build /usr/lib/x86_64-linux-gnu/libcrypto.so.3 /usr/lib/x86_64-linux-gnu/

# 复制 node_modules（含 prisma client）+ 编译产物
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package*.json ./

# 剔除 devDependencies，减小镜像体积
RUN npm prune --production

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main"]
