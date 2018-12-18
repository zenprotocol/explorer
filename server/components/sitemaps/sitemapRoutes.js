const router = require('express').Router();
const controller = require('./sitemapController');
const wrapAsync = require('../../lib/wrapAsyncForExpressErrors');

router.route('/index.xml').get(wrapAsync(controller.index));

router.route('/:name/:part.xml').get(wrapAsync(controller.sitemap));

module.exports = router;
