# Zen Protocol Block Explorer

## Dependencies
1. Docker - https://www.docker.com/
2. Docker Compose (Comes with docker) - https://docs.docker.com/compose/install/#prerequisites
2. nodejs + npm - https://nodejs.org

# Development
Server side was created from scratch using [express](https://expressjs.com/).  
Client side was bootstrapped with [create-react-app](https://github.com/facebook/create-react-app).

## Get started
1. `npm run setup` to create your env file
2. inside the created env file, fill in the block chain node url.  
The password can stay the same as this is a development password.
3. `docker-compose up` - this will:
   - Download all the needed images
   - Create all the containers. 
   - Start the web server.


### General Docker commands:
1. `docker-compose up` - start the server
2. `docker-compose exec <service name> sh` - start a shell inside once of the services. Replace `<service name>` with the wanted service.   
For example -   
`docker-compose exec web sh` - start a shell in the web container
`docker-compose exec web sh` - start a shell in the db container

## First time
1. log in to the docker web container as explained in [docker](#docker) 
2. run `npm run setup:db`
3. outside of the container, to get linting in your editor, also run `npm install`
4. working with npm should be done from inside of the container (the node_modules folder that is actually used is the one inside of the container)

## Sequelize (ORM)
we use sequelize to talk to the database  
in the docker web container, run `npx sequelize` to see all cli options.

## Deploy
### Heroku
- commit the code to heroku
- Client is built automatically with the npm script `heroku-postbuild`
- start web: `heroku ps:scale web=1 -a <app name>`
- start worker: `heroku ps:scale worker=1 -a <app name>`

## DB Copy/Backup, copy db from staging to production
### Heroku
**Heroku to Heroku**
1. `heroku pg:backups:capture --app <app name>`
2. **Copy from staging to production**: `heroku pg:backups:restore <staging app name>::<backup name, eg b001> DATABASE_URL --app <destination app name, eg app>`

**Heroku to local**
1. `heroku pg:backups:capture --app <app name>`
1. **get latest backup url from heroku**: `heroku pg:backups:url -a`
2. **linux download** (docker): `wget -O db.dump "<url from previous step>"`
3. **restore to a local db**: `pg_restore --verbose --clean --no-acl --no-owner -h localhost -U <postgres username> -d <db name> db.dump`

**Info**
- https://devcenter.heroku.com/articles/heroku-postgres-backups
- https://devcenter.heroku.com/articles/heroku-postgres-import-export

## Folder Structure
The project contain both the client and the server:
- **common** - common code that can be used between processes (client, server or worker)
- **public** - client public source files
- **server** - server code
- **src** - client source
- **worker** - server worker jobs & scheduler
