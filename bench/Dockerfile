FROM node:24-trixie-slim

WORKDIR /app/bench

RUN apt-get update && apt-get install -y \
    git \
    bash \
    && rm -rf /var/lib/apt/lists/*

COPY . /app

COPY package*.json ./
RUN npm install

CMD [ "bash" ]
