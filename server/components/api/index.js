const router = require('express').Router();

const blocksRouter = require('./blocks/blocksRoutes');
const inputsRouter = require('./inputs/inputsRoutes');
const outputsRouter = require('./outputs/outputsRoutes');
const transactionsRouter = require('./transactions/transactionsRoutes');
const addressesRouter = require('./addresses/addressesRoutes');
const contractsRouter = require('./contracts/contractsRoutes');
const infosRouter = require('./infos/infosRoutes');
const statsRouter = require('./stats/statsRoutes');
const searchRouter = require('./search/searchRoutes');

router.use('/blocks', blocksRouter);
router.use('/inputs', inputsRouter);
router.use('/outputs', outputsRouter);
router.use('/tx', transactionsRouter);
router.use('/addresses', addressesRouter);
router.use('/contracts', contractsRouter);
router.use('/infos', infosRouter);
router.use('/stats', statsRouter);
router.use('/search', searchRouter);

module.exports = router;