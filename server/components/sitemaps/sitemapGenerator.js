'use strict';

const sm = require('sitemap');
const blocksDAL = require('../api/blocks/blocksDAL');
const transactionsDAL = require('../api/transactions/transactionsDAL');
const addressAmountsDAL = require('../api/addressAmounts/addressAmountsDAL');
const assetOutstandingsDAL = require('../api/assetOutstandings/assetOutstandingsDAL');
const contractsDAL = require('../api/contracts/contractsDAL');
const getChain = require('../../lib/getChain');

const sequelize = blocksDAL.db.sequelize;
const URLS_PER_SITEMAP = 50000;

module.exports = {
  index: async function() {
    // count all object to know how many sitemap parts there are
    const [blocks, transactions, addresses, assets, contracts] = await Promise.all([
      blocksDAL.count(),
      transactionsDAL.count(),
      addressAmountsDAL.count({
        distinct: true,
        col: 'address',
      }),
      assetOutstandingsDAL.count(),
      contractsDAL.count(),
    ]);

    const subdomain = await getSubdomain();
    const host = `https://${subdomain}zp.io`;
    const urls = [
      `${host}/sitemaps/main/0.xml`,
    ];
    // blocks
    for (let part = 0; part * URLS_PER_SITEMAP < blocks; part++) {
      urls.push(`${host}/sitemaps/blocks/${part}.xml`);
    }
    // transactions
    for (let part = 0; part * URLS_PER_SITEMAP < transactions; part++) {
      urls.push(`${host}/sitemaps/transactions/${part}.xml`);
    }
    // addresses
    for (let part = 0; part * URLS_PER_SITEMAP < addresses; part++) {
      urls.push(`${host}/sitemaps/addresses/${part}.xml`);
    }
    // assets
    for (let part = 0; part * URLS_PER_SITEMAP < assets; part++) {
      urls.push(`${host}/sitemaps/assets/${part}.xml`);
    }
    // contracts
    for (let part = 0; part * URLS_PER_SITEMAP < contracts; part++) {
      urls.push(`${host}/sitemaps/contracts/${part}.xml`);
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
    const blocksCount = await blocksDAL.count();
    const urls = [];
    for (let blockNumber = 1; blockNumber <= blocksCount; blockNumber++) {
      urls.push({ url: `/blocks/${blockNumber}`, changefreq: 'never', priority: 0.7 });
    }
    return await createSitemap(urls);
  },
  transactions: async function() {
    const txs = await transactionsDAL.findAll({
      attributes: ['hash']
    });
    const urls = txs.map(tx => ({ url: `/tx/${tx.hash}`, changefreq: 'never', priority: 0.7 }));

    return await createSitemap(urls);
  },
  addresses: async function() {
    const addresses = await addressAmountsDAL.findAll({
      attributes: [[sequelize.literal('DISTINCT address'), 'address']],
    });
    const urls = addresses.map(({address}) => ({ url: `/address/${address}`, changefreq: 'monthly', priority: 0.3 }));

    return await createSitemap(urls);
  },
  assets: async function() {
    const assets = await assetOutstandingsDAL.findAll({
      attributes: ['asset']
    });
    const urls = assets.map(({asset}) => ({ url: `/assets/${asset}`, changefreq: 'monthly', priority: asset === '00' ? 0.8 : 0.3 }));

    return await createSitemap(urls);
  },
  contracts: async function() {
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