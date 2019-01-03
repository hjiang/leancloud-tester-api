FROM node:current-alpine

WORKDIR /app/
COPY package-lock.json package.json tsconfig.json ./
COPY src ./src
RUN npm install && npm run build
ENV HTTP_PORT=4000
ENV HTTPS_PORT=4040
EXPOSE ${HTTP_PORT}
EXPOSE ${HTTPS_PORT}
CMD node lib/index.js
