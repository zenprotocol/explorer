const router = require('express').Router();
const controller = require('./addressesController');
const transactionsController = require('../txs/transactionsController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/:address').get(wrapAsync(controller.show));

router.route('/:address/asset-types').get(wrapAsync(controller.findAllAssets));

router.route('/:address/assets').get(wrapAsync(transactionsController.assets));

router.route('/:address/balanceZP').get(wrapAsync(controller.balanceZp));

router.route('/:address/balance').get(wrapAsync(controller.balance));

module.exports = router;
