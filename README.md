# Zen Protocol Block Explorer

## Dependencies
1. Docker - https://www.docker.com/
2. nodejs + npm - https://nodejs.org

# Development
This project was bootstraped with ...

## Docker
// developer who only wants to contribute without deploying need docker as well?
// why use docker?
1. **first time** - run `npm run setup` to create an env file
2. `docker-compose up` in the root directory
3. in another shell, `docker-compose exec web sh` to connect to the web container.  
From there you can use `npm`

## First time
1. log in to the docker web container as explained in [docker](#docker) 
2. run `npm run setup:db`
3. outside of the container, to get linting in your editor, also run `npm install`
4. working with npm should be done from inside of the container (the node_modules folder that is actually used is the one inside of the container)

## Sequelize (ORM)
we use sequelize to talk to the database  
in the docker web container, run `npx sequelize` to see all cli options.

## Deploy
??

## Folder Structure
- **common** - common code that can be used in both client and server
- **public** - client public source files
- **server** - server code
- **src** - client source
- **worker** - server worker jobs & scheduler
