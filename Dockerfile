FROM node:v16.6.1

WORKDIR /app
COPY package* .
RUN npm install

CMD npm start