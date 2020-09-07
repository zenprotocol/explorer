const router = require('express').Router();

const blocksRouter = require('./blocks/blocksRoutes');
const inputsRouter = require('./inputs/inputsRoutes');
const outputsRouter = require('./outputs/outputsRoutes');
const transactionsRouter = require('./txs/transactionsRoutes');
const addressesRouter = require('./addresses/addressesRoutes');
const contractsRouter = require('./contracts/contractsRoutes');
const assetsRouter = require('./assets/assetsRoutes');
const infosRouter = require('./infos/infosRoutes');
const statsRouter = require('./stats/statsRoutes');
const searchRouter = require('./search/searchRoutes');
const votesRoutes = require('./repovotes/votesRoutes');
const cgpRoutes = require('./cgp/cgpRoutes');

router.use('/blocks', blocksRouter);
router.use('/inputs', inputsRouter);
router.use('/outputs', outputsRouter);
router.use('/tx', transactionsRouter);
router.use('/addresses', addressesRouter);
router.use('/contracts', contractsRouter);
router.use('/assets', assetsRouter);
router.use('/infos', infosRouter);
router.use('/stats', statsRouter);
router.use('/search', searchRouter);
router.use('/votes', votesRoutes);
router.use('/cgp', cgpRoutes);

module.exports = router;