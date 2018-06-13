FROM node:8.11.3-alpine

# do not run as root
RUN addgroup -g 1001 app \
    && adduser -u 1001 -G app -s /bin/sh -D app

RUN apk update && apk upgrade && apk add python g++ make && rm -rf /var/cache/apk/* && npm i -g npm

ENV HOME=/home/app
ENV APP_ROOT=$HOME/explorer

COPY package*.json $APP_ROOT/
RUN chown -R app:app $HOME/

USER app
WORKDIR $APP_ROOT
RUN npm i

USER root
COPY ./server $APP_ROOT/server
RUN chown -R app:app $APP_ROOT/server
USER app

EXPOSE 3000
EXPOSE 5858
CMD ["npm", "start"]