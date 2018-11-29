const router = require('express').Router();
const controller = require('./blocksController');
const transactionsController = require('../transactions/transactionsController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/').get(wrapAsync(controller.index));

router.route('/count').get(wrapAsync(controller.count));

router.route('/id/:id').get(wrapAsync(controller.getById));

router.route('/:hashOrBlockNumber').get(wrapAsync(controller.show));

router.route('/:hashOrBlockNumber/assets').get(wrapAsync(transactionsController.assets));

module.exports = router;
