const router = require('express').Router();
const controller = require('./infosController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/')
  .get(wrapAsync(controller.index));

router.route('/:name')
  .get(wrapAsync(controller.show));

module.exports = router;