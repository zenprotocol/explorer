const router = require('express').Router();
const oracleController = require('./oracleController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/data')
  .get(wrapAsync(oracleController.data));

router.route('/proof')
  .get(wrapAsync(oracleController.proof));

router.route('/lastUpdated')
  .get(wrapAsync(oracleController.lastUpdated));

module.exports = router;