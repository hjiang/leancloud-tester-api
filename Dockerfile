FROM node:current-alpine

WORKDIR /app/
COPY package-lock.json package.json tsconfig.json ./
COPY src ./src
RUN npm install && npm run build
ENV PORT=4000
EXPOSE ${PORT}
CMD node lib/index.js
