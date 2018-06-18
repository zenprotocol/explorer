const path = require('path');
const express = require('express');
const router = express.Router();
const wrapAsync = require('../common/wrapAsyncForExpressErrors');
const clientRenderer = require('./clientRenderer');

router.get('/', clientRenderer);
router.use(
  express.static(path.join(__dirname, '..', '..', '..', 'client', 'build'), { maxAge: '30d', index: false })
);

module.exports = router;
