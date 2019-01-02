FROM node:current-alpine

WORKDIR /app/
COPY package-lock.json package.json tsconfig.json ./
COPY src ./src
RUN npm install && npm run build
CMD node lib/index.js
