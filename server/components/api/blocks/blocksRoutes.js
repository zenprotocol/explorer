const router = require('express').Router();
const controller = require('./blocksController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/')
  .get(wrapAsync(controller.index))
  .post(wrapAsync(controller.create));

router.route('/:id')
  .get(wrapAsync(controller.show))
  .patch(wrapAsync(controller.update))
  .put(wrapAsync(controller.update))
  .delete(wrapAsync(controller.delete));

module.exports = router;