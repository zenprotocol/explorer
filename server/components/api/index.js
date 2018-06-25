const router = require('express').Router();

const blocksRouter = require('./blocks/blocksRoutes');

router.use('/blocks', blocksRouter);

module.exports = router;