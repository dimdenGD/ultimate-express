FROM node:24-trixie-slim

WORKDIR /app/bench

COPY . /app

COPY package*.json ./
RUN npm install

CMD [ "bash" ]
