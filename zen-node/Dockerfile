FROM mono

RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get update && apt-get install -y nodejs liblmdb0 libgomp1
RUN /usr/bin/npm i -g npm

RUN /usr/bin/npm config set @zen:registry https://www.myget.org/F/zenprotocol/npm/
RUN /usr/bin/npm install @zen/zen-node@1.0.4 -g

EXPOSE 5050
CMD ["zen-node", "--api *:5050"]