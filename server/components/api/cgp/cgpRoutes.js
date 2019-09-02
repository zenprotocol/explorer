const router = require('express').Router();
const controller = require('./cgpController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/relevant').get(wrapAsync(controller.relevantInterval));
router.route('/votes/:type').get(wrapAsync(controller.votes));
router.route('/results/:type').get(wrapAsync(controller.results));
router.route('/participatedZp/:type').get(wrapAsync(controller.zpParticipated));
router.route('/ballots/payout').get(wrapAsync(controller.payoutBallots));
router.route('/ballots/:type/content').get(wrapAsync(controller.ballotContent));

module.exports = router;