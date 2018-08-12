const router = require('express').Router();
const statsController = require('./statsController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/')
  .get(wrapAsync(statsController.index));

router.route('/:name')
  .get(wrapAsync(statsController.show));

module.exports = router;