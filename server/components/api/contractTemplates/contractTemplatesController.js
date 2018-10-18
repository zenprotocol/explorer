'use strict';

const httpStatus = require('http-status');
const contractTemplatesDAL = require('./contractTemplatesDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');

module.exports = {
  index: async function(req, res) {
    const templates = await contractTemplatesDAL.findAll();

    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, templates));
  },
  show: async function(req, res) {
    if (!req.params.slug) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }

    const template = await contractTemplatesDAL.findBySlug(req.params.slug);
    if (template) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, template));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  download: async function(req, res) {
    const { name, oracle, ticker, date, strike, templateId } = req.body;
    const templateIdValid = templateId && !isNaN(Number(templateId));

    // TODO - move shared validation code into common folder
    const validation = { name: true, oracle: true, ticker: true, date: true, strike: true };
    validation.name = !!name;
    validation.oracle = !!oracle;
    validation.ticker = !!ticker;
    validation.date = !!date && !isNaN(Date.parse(date));
    validation.strike = strike && !isNaN(strike) && strike >= 0 && Math.floor(strike) === strike;

    const valid =
      templateIdValid &&
      validation.name &&
      validation.oracle &&
      validation.ticker &&
      validation.date &&
      validation.strike;

    if (valid) {
      const { template } = await contractTemplatesDAL.findById(templateId);
      const timestamp = Math.round(new Date(date).getTime() / 1000 + 75600);
      const generated = template
        .replace(/%REPLACE_TICKER%/g, ticker)
        .replace(/%REPLACE_DATE%/g, date)
        .replace(/%REPLACE_TIMESTAMP%/g, timestamp)
        .replace(/%REPLACE_STRIKE%/g, strike);

      res.type('text/plain');
      res.set({ 'Content-Disposition': 'attachment; filename="template.fst"' });
      res.send(generated);
    } else {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }
  },
};
