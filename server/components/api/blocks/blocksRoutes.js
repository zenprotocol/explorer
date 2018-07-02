const router = require('express').Router();
const controller = require('./blocksController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/')
  .get(wrapAsync(controller.index));

router.route('/:id')
  .get(wrapAsync(controller.findByBlockNumber));

module.exports = router;