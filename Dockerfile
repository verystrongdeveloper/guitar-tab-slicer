FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates fontconfig fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["npm", "start"]
