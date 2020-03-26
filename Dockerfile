FROM node:12-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY ./dist .

EXPOSE 3000

CMD [ "node", "server.js" ]