const router = require('express').Router();
const controller = require('./blocksController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/')
  .get(wrapAsync(controller.index));

router.route('/id/:id')
  .get(wrapAsync(controller.getById));

router.route('/:hashOrBlockNumber')
  .get(wrapAsync(controller.show));

module.exports = router;