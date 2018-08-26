const router = require('express').Router();
const controller = require('./searchController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/:search?')
  .get(wrapAsync(controller.index));

module.exports = router;