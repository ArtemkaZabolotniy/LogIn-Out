FROM node:22-bookworm

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD [ "node", "./src/server.js" ]
