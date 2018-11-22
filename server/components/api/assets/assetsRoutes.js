const router = require('express').Router();
const controller = require('./assetsController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/')
  .get(wrapAsync(controller.index));

router.route('/:asset')
  .get(wrapAsync(controller.show));

router.route('/:asset/keyholders')
  .get(wrapAsync(controller.keyholders));

module.exports = router;