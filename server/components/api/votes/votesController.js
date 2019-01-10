'use strict';

const httpStatus = require('http-status');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const votesBLL = require('./votesBLL');

module.exports = {
  index: async function(req, res) {
    const vote = await votesBLL.findCurrentOrNext();
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, vote));
  },
};
