# Zen Protocol Block Explorer

## Dependencies
1. Docker - https://www.docker.com/
2. Docker Compose (Comes with docker) - https://docs.docker.com/compose/install/#prerequisites
2. nodejs + npm - https://nodejs.org

## General
Server side was created from scratch using [express](https://expressjs.com/).  
Client side was bootstrapped with [create-react-app](https://github.com/facebook/create-react-app).

# Development

## Get Started Guide
1. Make sure docker is running
2. Open a terminal in the root folder of the project.
3. `npm run setup` - to create your env file and needed directories and to install dependencies.
3. Open .env file and fill missing data
3. `npm run client:build` - to build the front end
4. `npm run docker:up:all` - this will:
   - Download all the needed images
   - Create all the containers. 
   - Start the web server.
5. Setup the database -
   1. `docker-compose exec web sh` - to run a shell inside of the web container. 
   2. `npm run setup:db`
   3. `exit` - to exit the container
6. Start caching the db or copy the staging db   
   - **Option 1** - run the worker to cache your db   
      1. `docker-compose exec web sh`
      2. `node worker` - start the worker
      3. let it work
   - **Option 2** - copy the db from staging   
      1. Follow the steps in [Heroku to local](#heroku-to-local)
8. Setup is done - shut down server - `npm run docker:stop`

## Normal development workflow
1. **Option A** - Server + Client
   - `npm run dev`
2. **Option B** - Server + Zen node + Client
   - `npm run dev:all`
3. Watch server/worker/other **logs**
   - `npm run docker:logs -- [service]`
   - `npm run docker:logs` - all services
   - `npm run docker:logs -- web` - just web server
4. When done - `npm run docker:stop` to stop all containers

## Load client from server
1. `npm run client:build` - creates the build folder
2. `npm run docker:up`
3. now load http://localhost:3000

### General Docker commands:
1. `docker-compose logs` - Watch logs from the containers - https://docs.docker.com/compose/reference/logs/
1. `docker-compose up` - start the server
2. `docker-compose exec <service name> sh` - start a shell inside once of the services. Replace `<service name>` with the wanted service.   
For example -   
`docker-compose exec web sh` - start a shell in the web container
`docker-compose exec web sh` - start a shell in the db container
3. `docker ps -a` - list all containers
4. `docker stop $(docker ps -a -q)` stop all containers
5. `docker rm $(docker ps -a -q -f status=exited)` - remove all exited containers
6. `docker images` - list all images
7. `docker rmi $(docker images -q)` - remove all images



## Sequelize (ORM)
we use sequelize to talk to the database  
in the docker web container, run `npx sequelize` to see all cli options.

## Deploy
### Heroku
- commit the code to heroku
- Client is built automatically with the npm script `heroku-postbuild`
- start web: `heroku ps:scale web=1 -a <app name>`
- start worker: `heroku ps:scale worker=1 -a <app name>`
- Set environment variables:
  - **DATABASE_URL**
  - **REDISCLOUD_URL**
  - **zp__node** - The remote node url
  - **GOOGLE_TRACKING_ID**
  - **GOVERNANCE_CONTRACT_ID** - The contract ID of the repo voting
  - **governance__afterTallyBlocks** - How many blocks after tally to show the vote results 
  - **REACT_APP_PROD_ENV** - staging/production
  - **APP_NAME** - the application name for better logs

## DB Copy/Backup, copy db from staging to production
### Heroku
#### Heroku to Heroku
1. `heroku pg:backups:capture --app <app name>`
2. **Copy from staging to production**: `heroku pg:backups:restore <staging app name>::<backup name, eg b001> DATABASE_URL --app <destination app name, eg app>`

#### Heroku to local
1. `heroku pg:backups:capture --app <app name>`
1. **get latest backup url from heroku**: `heroku pg:backups:url -a <app name>`
2. log into db container `docker-compose exec db sh`
2. `cd home` in the db container
2. **linux download** (docker): `wget -O db.dump "<url from previous step>"`
3. **restore to a local db** (replace `<db name>` with actual name): `pg_restore --verbose --clean --no-acl --no-owner -h localhost -U postgres -d <db name> db.dump`

**Info**
- https://devcenter.heroku.com/articles/heroku-postgres-backups
- https://devcenter.heroku.com/articles/heroku-postgres-import-export

## Folder Structure
The project contain both the client and the server:
- **src** - client source
- **src/common** - common code that can be used between processes (client, server or worker)
- **public** - client public source files
- **server** - server code
- **worker** - server worker jobs & scheduler
- **test** - general code for tests

## Examining the db in the container
1. `docker-compose exec db sh`
2. `psql -U postgres`
3. `\c <db name>`
4. Run SQL queries or use any of the psql commands (run `\?` for help)