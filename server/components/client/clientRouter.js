const path = require('path');
const express = require('express');
const router = express.Router();
const wrapAsync = require('../../lib/wrapAsyncForExpressErrors');
const clientRenderer = require('./clientRenderer');

router.get('/', clientRenderer);
router.use('/public',
  express.static(path.join(__dirname, '..', '..', '..', 'client', 'build'), { maxAge: '30d', index: false })
);

module.exports = router;
