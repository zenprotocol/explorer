const router = require('express').Router();
const controller = require('./inputsController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/')
  .get(wrapAsync(controller.index));

router.route('/:id')
  .get(wrapAsync(controller.show));

module.exports = router;