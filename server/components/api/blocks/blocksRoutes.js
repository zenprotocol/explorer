const router = require('express').Router();
const controller = require('./blocksController');
const txsController = require('../txs/txsController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

const addHashOrBlockNumberToQuery = (req, res, next) => {
  req.query.hashOrBlockNumber = req.params.hashOrBlockNumber;
  next();
};

router.route('/').get(wrapAsync(controller.index));

router.route('/total-zp').get(wrapAsync(controller.getTotalZp));

router.route('/count').get(wrapAsync(controller.count));

router.route('/:hashOrBlockNumber').get(wrapAsync(controller.show));

router
  .route('/:hashOrBlockNumber/txs')
  .get(addHashOrBlockNumberToQuery, wrapAsync(txsController.index));

module.exports = router;

