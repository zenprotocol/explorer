const router = require('express').Router();
const controller = require('./contractTemplatesController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/')
  .get(wrapAsync(controller.index));

router.route('/:slug')
  .get(wrapAsync(controller.show));

router.route('/download')
  .post(wrapAsync(controller.download));

module.exports = router;