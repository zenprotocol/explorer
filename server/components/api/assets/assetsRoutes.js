const router = require('express').Router();
const controller = require('./assetsController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/:asset')
  .get(wrapAsync(controller.show));

module.exports = router;