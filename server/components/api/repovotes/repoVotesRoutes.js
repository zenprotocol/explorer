const router = require('express').Router();
const controller = require('./repoVotesController');
const middleware = require('./repoVotesMiddleware');
const interval1CacheController = require('./cache/1/interval1CacheController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/').get(wrapAsync(interval1CacheController.index), wrapAsync(controller.index));

router
  .route('/relevant')
  .get(
    middleware.parseQueryParams,
    wrapAsync(interval1CacheController.relevantInterval),
    wrapAsync(controller.relevantInterval)
  );

router
  .route('/next')
  .get(
    middleware.parseQueryParams,
    wrapAsync(interval1CacheController.nextInterval),
    wrapAsync(controller.nextInterval)
  );

router
  .route('/prev')
  .get(
    middleware.parseQueryParams,
    wrapAsync(interval1CacheController.prevInterval),
    wrapAsync(controller.prevInterval)
  );

router
  .route('/interval')
  .get(
    middleware.parseQueryParams,
    wrapAsync(interval1CacheController.getInterval),
    wrapAsync(controller.getInterval)
  );

router
  .route('/current-next-or-prev')
  .get(
    middleware.parseQueryParams,
    wrapAsync(interval1CacheController.currentNextOrPrev),
    wrapAsync(controller.currentNextOrPrev)
  );

router
  .route('/results')
  .get(
    middleware.parseQueryParams,
    wrapAsync(interval1CacheController.results),
    wrapAsync(controller.results)
  );

router
  .route('/candidates')
  .get(
    middleware.parseQueryParams,
    wrapAsync(interval1CacheController.getCandidates),
    wrapAsync(controller.getCandidates)
  );

router
  .route('/intervals')
  .get(
    middleware.parseQueryParams,
    wrapAsync(interval1CacheController.recentIntervals),
    wrapAsync(controller.recentIntervals)
  );

module.exports = router;
