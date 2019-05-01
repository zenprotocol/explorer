const router = require('express').Router();
const controller = require('./votesController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/')
  .get(wrapAsync(controller.index));

router.route('/tally').get(wrapAsync(controller.show));

module.exports = router;