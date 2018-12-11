const path = require('path');
const express = require('express');
const router = express.Router();
const clientRenderer = require('./clientRenderer');

router.use('/public',
  express.static(path.join(__dirname, '..', '..', '..', 'build'), { maxAge: '30d', index: false })
);
router.get('/blocks', insertRouteName('blocks'), clientRenderer);
router.get('/blocks/:hashOrBlockNumber', insertRouteName('block'), clientRenderer);
router.get('*', clientRenderer);

function insertRouteName(name) {
  return (req, res, next) => {
    req.routeName = name;
    next();
  };
}

module.exports = router;
