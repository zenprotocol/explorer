'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const EOL = require('os').EOL;
const rootDir = __dirname;

const readlineAsync = ReadLineAsync();

function RequiredFilesProcessor(inputFilename, outputFilename) {
  const globalDict = {};

  /**
   * Gathers data from the required.env file
   */
  function gatherData(filename) {
    if (!fs.existsSync(path.join(rootDir, filename))) {
      return;
    }

    const requiredFile = path.resolve(rootDir, filename);
    const lines = fs.readFileSync(requiredFile, { encoding: 'utf8' }).split(EOL);
    lines.forEach((line) => {
      const [key, value] = line.split('=');

      if(!key) return;

      // global
      // add key to dict
      if (!globalDict[key]) {
        globalDict[key] = undefined;
      }

      // add value if not exist already, priority to environment
      if (globalDict[key] === undefined && (process.env[key] || value)) {
        globalDict[key] = process.env[key] || value;
      }
    });
  }

  async function gatherMissingDataFromUser() {
    const askedFor = []; // already asked for env vars

    const keys = Object.keys(globalDict);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (!globalDict[key] && !askedFor.includes(key)) {
        askedFor.push(key);
        const value = await readlineAsync.question(`Please provide a value for "${key}": `);
        globalDict[key] = value;
      }
    }
  }

  function writeFiles() {
    const envFileContent = Object.keys(globalDict).reduce((str, key) => {
      const value = globalDict[key] ? globalDict[key] : '';
      str += `${key}=${value}` + EOL;
      return str;
    }, '');

    // write the file
    fs.writeFileSync(path.join(rootDir, outputFilename), envFileContent, { encoding: 'utf8' });
    console.log(`Wrote ${path.join(rootDir, outputFilename)}`);
  }

  return {
    process: async () => {
      // check if required file exists
      if (!fs.existsSync(path.join(rootDir, inputFilename))) {
        throw new Error(`${inputFilename} must exist in the root folder`);
      }
      // try to gather from the output file first if it exists
      
      gatherData(outputFilename);
      gatherData(inputFilename);
      await gatherMissingDataFromUser();
      writeFiles();
    },
  };
}

function ReadLineAsync() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function question(query) {
    return new Promise((res) => {
      rl.question(query, res);
    });
  }

  function close() {
    rl.close();
  }

  return {
    question,
    close,
  };
}

function createDirectories() {
  const dirs = ['data', 'data/redis'];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  });
}

async function run() {
  console.log('creating env file');
  const envProcessor = RequiredFilesProcessor('required.env', '.env');
  await envProcessor.process();
  console.log('creating required directories');
  createDirectories();
  console.log('Finished.');
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err.message);
  });
