FROM node:16.7.0-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY index.js .

CMD npm start