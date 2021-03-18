# Zen Protocol Block Explorer

## Dependencies
1. Docker - https://www.docker.com/
2. Docker Compose - https://docs.docker.com/compose/install/#prerequisites
2. nodejs + npm - https://nodejs.org

## General
Server side was created from scratch using [express](https://expressjs.com/).  
Client side was bootstrapped with [create-react-app](https://github.com/facebook/create-react-app).

# Development

## Get Started Guide
1. Make sure docker is running
2. Open a terminal in the root folder of the project.
3. `npm run setup`   
this will:
   1. create your env file
   2. create needed directories
   3. install dependencies
   4. initialize the database in the docker container

## Normal development workflow
1. **Option A** - Server + Client
   - `npm run dev`
2. **Option B** - Server + Zen node + Client
   - `npm run dev:all`
3. Watch server/worker/other **logs**
   - `npm run docker:logs -- [service]`
   - `npm run docker:logs` - all services
   - `npm run docker:logs -- web` - just web server
4. The site will be available at localhost:3001 via the webpack server and on localhost:3000 via the explorer actual express server (this will not auto refresh the client on change, one must build the client again and re-save one of the server files in order to refresh it)
5. When done - `npm run docker:stop` to stop all containers

## Load client from server
1. `npm run client:build` - creates the build folder
2. `npm run docker:up`
3. now load http://localhost:3000

## Building the development database
In order to have some blockchain data in the development environment you should add data to the database:
- **Option 1** - run the worker to cache your db   
   1. `docker-compose exec web node worker`
   2. let it work (long operation)
- **Option 2** - copy the db from staging   
   1. Follow the steps in [Heroku to local](#heroku-to-local)

## Tests
Running tests in development should be done from inside of the docker container, as the tests need all of the environment:
```
docker-compose exec web npm t
```

## Worker
The worker layer is responsible for fetching new blocks from a node and mapping them to the database.  
for further info visit [the worker docs](./worker/README.md)

## Reset the database to a certain block number
Sometimes it is needed to reset the state of the database to a specific block number in the past:  
1. Reset the blocks and all related tables (run this against the database):  
```
DELETE FROM "Blocks" WHERE "blockNumber" > X;
```
2. Optionally delete data from `*PerDay` tables
3. run the script to re-calculate all addresses/assets:  
(run this in the server machine or in the web container)
```
node worker/run-once/recalcAddressesAssetsCurState.js
```  
4. When in need to re-calculate the contracts: (in web container)
```
node worker/run-once/insertAllContractsFromTransactions.js
```
5. now the database is in complete state for block X

## General Docker commands:
1. `docker-compose logs` - Watch logs from the containers - https://docs.docker.com/compose/reference/logs/
1. `docker-compose up` - start the server
2. `docker-compose exec <service name> sh` - start a shell inside once of the services. Replace `<service name>` with the wanted service.   
For example -   
`docker-compose exec web sh` - start a shell in the web container
`docker-compose exec db sh` - start a shell in the db container
3. `docker ps -a` - list all containers
4. `docker stop $(docker ps -a -q)` stop all containers
5. `docker rm $(docker ps -a -q -f status=exited)` - remove all exited containers
6. `docker images` - list all images
7. `docker rmi $(docker images -q)` - remove all images

## Sequelize (ORM)
we use sequelize to talk to the database  
in the docker web container, run `npx sequelize` to see all cli options.

# Deploy
## Heroku
- commit the code to heroku
- Client is built automatically with the npm script `heroku-postbuild`
- start web: `heroku ps:scale web=1 -a <app name>`
- start worker: `heroku ps:scale worker=1 -a <app name>`
- Set environment variables:
  - **DATABASE_URL**
  - **REDISCLOUD_URL**
  - **zp__node** - The remote node url
  - **GOOGLE_TRACKING_ID**
  - **CGP_FUND_CONTRACT_ID**
  - **CGP_VOTING_CONTRACT_ID**
  - **CGP_FUND_PAYOUT_BALLOT**
  - **GOVERNANCE_CONTRACT_ID** - The contract ID of the repo voting
  - **governance__afterTallyBlocks** - How many blocks after tally to show the vote results 
  - **GENESIS_TOTAL_ZP** - the amount of zp in the genesis block (in ZP, not Kalapas)
  - **CONTRACT_NAMING_JSON**
  - **ASSET_NAMING_JSON**
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