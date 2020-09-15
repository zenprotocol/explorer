'use strict';

const sm = require('sitemap');
const blocksDAL = require('../api/blocks/blocksDAL');
const txsDAL = require('../api/txs/txsDAL');
const addressesDAL = require('../api/addresses/addressesDAL');
const assetsDAL = require('../api/assets/assetsDAL');
const contractsDAL = require('../api/contracts/contractsDAL');
const getChain = require('../../lib/getChain');

const sequelize = blocksDAL.db.sequelize;
const URLS_PER_SITEMAP = 50000;
const PAGE_SIZE = 10;

module.exports = {
  index: async function() {
    // count all object to know how many sitemap parts there are
    const [blocks, transactions, addresses, assets, contracts] = await Promise.all([
      blocksDAL.count(),
      txsDAL.count(),
      addressesDAL.count({
        distinct: true,
        col: 'address',
      }),
      assetsDAL.count(),
      contractsDAL.count(),
    ]);

    const subdomain = await getSubdomain();
    const host = `https://${subdomain}zp.io`;
    const urls = [
      `${host}/sitemaps/main/0.xml`,
    ];
    // block
    for (let part = 0; part * URLS_PER_SITEMAP < blocks; part++) {
      urls.push(`${host}/sitemaps/block/${part}.xml`);
    }
    // transaction
    for (let part = 0; part * URLS_PER_SITEMAP < transactions; part++) {
      urls.push(`${host}/sitemaps/transaction/${part}.xml`);
    }
    // address
    for (let part = 0; part * URLS_PER_SITEMAP < addresses; part++) {
      urls.push(`${host}/sitemaps/address/${part}.xml`);
    }
    // asset
    for (let part = 0; part * URLS_PER_SITEMAP < assets; part++) {
      urls.push(`${host}/sitemaps/asset/${part}.xml`);
    }
    // contract
    for (let part = 0; part * URLS_PER_SITEMAP < contracts; part++) {
      urls.push(`${host}/sitemaps/contract/${part}.xml`);
    }
    return sm.buildSitemapIndex({
      urls,
    });
  },
  main: async function() {
    return await createSitemap([
      { url: '/blocks', changefreq: 'hourly', priority: 0.9 },
      { url: '/contracts', changefreq: 'weekly', priority: 0.9 },
      { url: '/assets', changefreq: 'weekly', priority: 0.9 },
      { url: '/blockchain/info', changefreq: 'daily', priority: 0.9 },
      { url: '/charts/transactions', changefreq: 'daily', priority: 0.7 },
      { url: '/charts/difficulty', changefreq: 'daily', priority: 0.7 },
      { url: '/charts/hashrate', changefreq: 'daily', priority: 0.7 },
      { url: '/charts/richlist', changefreq: 'daily', priority: 0.7 },
      { url: '/charts/supply', changefreq: 'daily', priority: 0.7 },
      { url: '/broadcastTx', changefreq: 'never', priority: 0.7 },
      { url: '/oracle', changefreq: 'daily', priority: 0.7 },
    ]);
  },
  blocks: async function() {
    const itemsCount = await blocksDAL.count();
    const urls = [];
    const numOfPages = getNumOfPages(itemsCount);
    for (let page = 1; page <= numOfPages; page++) {
      urls.push({ url: `/blocks?p=${page}&s=${PAGE_SIZE}`, changefreq: 'hourly', priority: 0.9 });
    }
    return await createSitemap(urls);
  },
  block: async function() {
    const blocksCount = await blocksDAL.count();
    const urls = [];
    for (let blockNumber = 1; blockNumber <= blocksCount; blockNumber++) {
      urls.push({ url: `/blocks/${blockNumber}`, changefreq: 'never', priority: 0.7 });
    }
    return await createSitemap(urls);
  },
  transaction: async function() {
    const txs = await txsDAL.findAll({
      attributes: ['hash']
    });
    const urls = txs.map(tx => ({ url: `/tx/${tx.hash}`, changefreq: 'never', priority: 0.7 }));

    return await createSitemap(urls);
  },
  address: async function() {
    const addresses = await addressesDAL.findAll({
      attributes: [[sequelize.literal('DISTINCT address'), 'address']],
    });
    const urls = addresses.map(({address}) => ({ url: `/address/${address}`, changefreq: 'monthly', priority: 0.3 }));

    return await createSitemap(urls);
  },
  assets: async function() {
    const itemsCount = await assetsDAL.count();
    const urls = [];
    const numOfPages = getNumOfPages(itemsCount);
    for (let page = 1; page <= numOfPages; page++) {
      urls.push({ url: `/assets?p=${page}&s=${PAGE_SIZE}`, changefreq: 'monthly', priority: 0.5 });
    }
    return await createSitemap(urls);
  },
  asset: async function() {
    const assets = await assetsDAL.findAll({
      attributes: ['asset']
    });
    const urls = assets.map(({asset}) => ({ url: `/assets/${asset}`, changefreq: 'monthly', priority: asset === '00' ? 0.8 : 0.3 }));

    return await createSitemap(urls);
  },
  contracts: async function() {
    const itemsCount = await contractsDAL.count();
    const urls = [];
    const numOfPages = getNumOfPages(itemsCount);
    for (let page = 1; page <= numOfPages; page++) {
      urls.push({ url: `/contracts?p=${page}&s=${PAGE_SIZE}`, changefreq: 'monthly', priority: 0.5 });
    }
    return await createSitemap(urls);
  },
  contract: async function() {
    const contracts = await contractsDAL.findAll({
      attributes: ['address']
    });
    const urls = contracts.map(({address}) => ({ url: `/contracts/${address}`, changefreq: 'monthly', priority: 0.3 }));

    return await createSitemap(urls);
  },
};

/**
 * Creates an array of sitemaps, each one limited to 50,000 urls
 */
async function createSitemap(urls) {
  const subdomain = await getSubdomain();
  const parts = [];
  for (let i = 0; i * URLS_PER_SITEMAP < urls.length; i++) {
    parts.push(urls.slice(i * URLS_PER_SITEMAP, i * URLS_PER_SITEMAP + URLS_PER_SITEMAP));
  }
  return parts.map(part => sm.createSitemap({
    hostname: `https://${subdomain}zp.io`,
    urls: part,
  }));
}

async function getSubdomain() {
  const chain = await getChain();
  return chain.startsWith('test') ? 'testnet.' : '';
}

function getNumOfPages(itemsCount) {
  return Math.ceil(itemsCount / PAGE_SIZE);
}
