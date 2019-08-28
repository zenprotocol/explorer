'use strict';

function formatInterval(interval) {
  return isNaN(Number(interval)) || Number(interval) === 0 ? null : Number(interval);
}

module.exports = formatInterval;