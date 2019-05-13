const router = require('express').Router();
const controller = require('./votesController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/')
  .get(wrapAsync(controller.index));

router.route('/relevant').get(wrapAsync(controller.relevantInterval));
router.route('/next').get(wrapAsync(controller.nextInterval));
router.route('/results').get(wrapAsync(controller.results));
router.route('/intervals').get(wrapAsync(controller.recentIntervals));

module.exports = router;