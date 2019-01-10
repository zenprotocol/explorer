const router = require('express').Router();

const blocksRouter = require('./blocks/blocksRoutes');
const inputsRouter = require('./inputs/inputsRoutes');
const outputsRouter = require('./outputs/outputsRoutes');
const transactionsRouter = require('./transactions/transactionsRoutes');
const addressesRouter = require('./addresses/addressesRoutes');
const contractsRouter = require('./contracts/contractsRoutes');
const assetsRouter = require('./assets/assetsRoutes');
const infosRouter = require('./infos/infosRoutes');
const statsRouter = require('./stats/statsRoutes');
const searchRouter = require('./search/searchRoutes');
const oracleRouter = require('./oracle/oracleRoutes');
const contractTemplatesRouter = require('./contractTemplates/contractTemplatesRoutes');
const votesRoutes = require('./votes/votesRoutes');

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
router.use('/oracle', oracleRouter);
router.use('/contractTemplates', contractTemplatesRouter);
router.use('/votes', votesRoutes);

module.exports = router;