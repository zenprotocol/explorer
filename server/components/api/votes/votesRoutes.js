const router = require('express').Router();
const controller = require('./votesController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/')
  .get(wrapAsync(controller.index));

router.route('/tally').get(wrapAsync(controller.currentOrPrevInterval));
router.route('/next').get(wrapAsync(controller.nextInterval));

module.exports = router;