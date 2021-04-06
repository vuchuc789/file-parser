FROM node:14.16.1-alpine

RUN apk add \
  gcc g++ make python3 \
  antiword exiftool

WORKDIR /app

COPY . .

RUN npm install

RUN apk del gcc g++ make python3

CMD npm start
