const path = require('path');
const express = require('express');
const router = express.Router();
const wrapAsync = require('../../lib/wrapAsyncForExpressErrors');
const clientRenderer = require('./clientRenderer');

router.use('/public',
  express.static(path.join(__dirname, '..', '..', '..', 'build'), { maxAge: '30d', index: false })
);
router.get('*', clientRenderer);

module.exports = router;
