const router = require('express').Router();
const controller = require('./txsController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/')
  .get(wrapAsync(controller.index));

router.route('/broadcast')
  .post(wrapAsync(controller.broadcast));

router.route('/raw')
  .post(wrapAsync(controller.getFromRaw));

router.route('/:hash')
  .get(wrapAsync(controller.show));

router.route('/:hash/assets')
  .get(wrapAsync(controller.assets));

module.exports = router;