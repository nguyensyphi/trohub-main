FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 5001

ENTRYPOINT ["./docker-entrypoint.sh"]
