const router = require('express').Router();

const blocksRouter = require('./blocks/blocksRoutes');
const inputsRouter = require('./inputs/inputsRoutes');
const outputsRouter = require('./outputs/outputsRoutes');
const transactionsRouter = require('./transactions/transactionsRoutes');
const addressesRouter = require('./addresses/addressesRoutes');

router.use('/blocks', blocksRouter);
router.use('/inputs', inputsRouter);
router.use('/outputs', outputsRouter);
router.use('/tx', transactionsRouter);
router.use('/address', addressesRouter);

module.exports = router;