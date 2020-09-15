const router = require('express').Router();

const blocksRouter = require('./blocks/blocksRoutes');
const inputsRouter = require('./inputs/inputsRoutes');
const outputsRouter = require('./outputs/outputsRoutes');
const txsRoutes = require('./txs/txsRoutes');
const addressesRouter = require('./addresses/addressesRoutes');
const contractsRouter = require('./contracts/contractsRoutes');
const assetsRouter = require('./assets/assetsRoutes');
const infosRouter = require('./infos/infosRoutes');
const statsRouter = require('./stats/statsRoutes');
const searchRouter = require('./search/searchRoutes');
const repoVotesRoutes = require('./repovotes/repoVotesRoutes');
const cgpRoutes = require('./cgp/cgpRoutes');

router.use('/blocks', blocksRouter);
router.use('/inputs', inputsRouter);
router.use('/outputs', outputsRouter);
router.use('/txs', txsRoutes);
router.use('/addresses', addressesRouter);
router.use('/contracts', contractsRouter);
router.use('/assets', assetsRouter);
router.use('/infos', infosRouter);
router.use('/stats', statsRouter);
router.use('/search', searchRouter);
router.use('/votes', repoVotesRoutes);
router.use('/cgp', cgpRoutes);

module.exports = router;