const router = require('express').Router();
const controller = require('./votesController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/')
  .get(wrapAsync(controller.index));

module.exports = router;