'use strict';

const httpStatus = require('http-status');
const HttpError = require('../../lib/HttpError');
const generator = require('./sitemapGenerator');
const SITEMAPS = require('./sitemaps');

module.exports = {
  index: async function(req, res) {
    const sitemap = await generator.index();
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  },
  sitemap: async function(req, res) {
    const {name, part} = req.params;
    if(!SITEMAPS.includes(name)) {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
    const sitemaps = await generator[name]();
    if(part >= sitemaps.length) {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
    const result = sitemaps[part].toString();
    res.header('Content-Type', 'application/xml');
    res.send(result);
  },
};
