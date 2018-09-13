FROM node:8.12.0-jessie

RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF
RUN apt-get update
RUN apt-get -y install apt-transport-https
RUN echo "deb https://download.mono-project.com/repo/debian stable-jessie main" | tee /etc/apt/sources.list.d/mono-official-stable.list
RUN apt-get update
RUN apt-get install -y mono-devel liblmdb0

RUN npm i -g npm

RUN npm config set @zen:registry https://www.myget.org/F/zenprotocol/npm/
RUN npm install @zen/zen-node -g

EXPOSE 5050
CMD ["zen-node", "--api *:5050"]