const router = require('express').Router();
const controller = require('./cgpController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/relevant').get(wrapAsync(controller.relevantInterval));
router.route('/votes/:type').get(wrapAsync(controller.votes));
router.route('/results/:type').get(wrapAsync(controller.results));
router.route('/ballots/payout').get(wrapAsync(controller.payoutBallots));

module.exports = router;