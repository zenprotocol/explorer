FROM node:8.12.0-alpine

RUN apk update && apk upgrade && apk --no-cache add curl && apk add python g++ make && rm -rf /var/cache/apk/* && npm i -g npm

ENV HOME=/home/app
ENV APP_ROOT=$HOME/explorer

COPY package*.json .npmrc $APP_ROOT/

WORKDIR $APP_ROOT
RUN npm i

EXPOSE 3000
EXPOSE 5858
CMD ["npm", "start"]