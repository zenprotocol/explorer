const router = require('express').Router();
const controller = require('./transactionsController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/')
  .get(wrapAsync(controller.index));

router.route('/id/:id')
  .get(wrapAsync(controller.getById));

router.route('/:hash')
  .get(wrapAsync(controller.show));

router.route('/:txHash/assets')
  .get(wrapAsync(controller.assets));

router.route('/:id/:asset')
  .get(wrapAsync(controller.asset));

module.exports = router;