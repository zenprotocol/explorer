const router = require('express').Router();
const controller = require('./repoVotesController');
const middleware = require('./repoVotesMiddleware');
const interval1CacheController = require('./cache/1/interval1CacheController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/').get(wrapAsync(interval1CacheController.index), wrapAsync(controller.index));

router
  .route('/relevant')
  .get(
    middleware.parsePhaseParam,
    wrapAsync(interval1CacheController.relevantInterval),
    wrapAsync(controller.relevantInterval)
  );

router
  .route('/next')
  .get(
    middleware.parsePhaseParam,
    wrapAsync(interval1CacheController.nextInterval),
    wrapAsync(controller.nextInterval)
  );

router
  .route('/current-or-next')
  .get(
    middleware.parsePhaseParam,
    wrapAsync(interval1CacheController.currentOrNextInterval),
    wrapAsync(controller.currentOrNextInterval)
  );

router
  .route('/results')
  .get(
    middleware.parsePhaseParam,
    wrapAsync(interval1CacheController.results),
    wrapAsync(controller.results)
  );

router
  .route('/candidates')
  .get(
    middleware.parsePhaseParam,
    wrapAsync(interval1CacheController.getCandidates),
    wrapAsync(controller.getCandidates)
  );

router
  .route('/intervals')
  .get(
    middleware.parsePhaseParam,
    wrapAsync(interval1CacheController.recentIntervals),
    wrapAsync(controller.recentIntervals)
  );

module.exports = router;
