const router = require('express').Router();
const controller = require('./addressesController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

// router.route('/')
//   .get(wrapAsync(controller.index));

router.route('/:hash')
  .get(wrapAsync(controller.show));

module.exports = router;