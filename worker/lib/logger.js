module.exports = function(processName) {
  return require('../../server/lib/namedLogger')(`worker.${processName}`);
};