'use strict';
const fs = require('fs');

function createEnvFile() {
  if (!fs.existsSync('.env')) {
    fs.createReadStream('.sample-env').pipe(fs.createWriteStream('.env'));
  }
}

function createDirectories() {
  const dirs = ['data', 'data/redis'];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  });
}

createEnvFile();
createDirectories();
