const router = require('express').Router();
const blocksController = require('../api/blocks/blocksController');
const wrapAsync = require('../../lib/wrapAsyncForExpressErrors');

router.route('/totalzp')
  .get(wrapAsync(blocksController.getTotalZp));

module.exports = router;