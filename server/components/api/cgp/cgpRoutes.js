const router = require('express').Router();
const controller = require('./cgpController');
const middleware = require('./cgpMiddleware');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/relevant').get(middleware.parseParams, wrapAsync(controller.relevantInterval));
router
  .route('/votes/:type')
  .get(middleware.validateType, middleware.parseParams, wrapAsync(controller.votes));
router
  .route('/results/:type')
  .get(middleware.validateType, middleware.parseParams, wrapAsync(controller.results));
router
  .route('/participatedZp/:type')
  .get(middleware.validateType, middleware.parseParams, wrapAsync(controller.zpParticipated));
router
  .route('/ballots/nomination')
  .get(middleware.parseParams, wrapAsync(controller.nominationBallots));
router.route('/ballots/payout').get(middleware.parseParams, wrapAsync(controller.payoutBallots));
router
  .route('/ballots/:type/content')
  .get(middleware.validateType, middleware.parseParams, wrapAsync(controller.ballotContent));

module.exports = router;
