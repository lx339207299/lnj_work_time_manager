FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20
WORKDIR /app
COPY --from=build /app/package*.json ./
RUN npm ci
COPY --from=build /app/dist ./dist
COPY --from=build /app/.env ./
COPY --from=build /app/prisma ./prisma
RUN apt-get update -y && apt-get install -y openssl
RUN npx prisma generate
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main"]
