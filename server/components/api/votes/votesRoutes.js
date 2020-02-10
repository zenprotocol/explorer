const router = require('express').Router();
const controller = require('./votesController');
const interval1CacheController = require('./cache/1/interval1CacheController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/').get(wrapAsync(interval1CacheController.index), wrapAsync(controller.index));

router
  .route('/relevant')
  .get(
    wrapAsync(interval1CacheController.relevantInterval),
    wrapAsync(controller.relevantInterval)
  );

router
  .route('/next')
  .get(
    wrapAsync(interval1CacheController.nextInterval),
    wrapAsync(controller.nextInterval)
  );

router
  .route('/results')
  .get(wrapAsync(interval1CacheController.results), wrapAsync(controller.results));

router
  .route('/candidates')
  .get(
    wrapAsync(interval1CacheController.getCandidates),
    wrapAsync(controller.getCandidates)
  );

router
  .route('/intervals')
  .get(
    wrapAsync(interval1CacheController.recentIntervals),
    wrapAsync(controller.recentIntervals)
  );

module.exports = router;
