const httpStatus = require('http-status');
const HttpError = require('../../../lib/HttpError');

module.exports = {
  /**
   * Make sure params are correct
   */
  parseParams: function(req, res, next) {
    // interval and phase can come from query (API) or params (client renderer)
    const { interval: qInterval, phase: qPhase } = req.query;
    const { type, interval: pInterval, phase: pPhase } = req.params;

    if (typeof qInterval !== 'undefined') {
      req.query.interval =
        isNaN(Number(qInterval)) || Number(qInterval) === 0 ? null : Number(qInterval);
    }
    if (typeof pInterval !== 'undefined') {
      req.params.interval =
        isNaN(Number(pInterval)) || Number(pInterval) === 0 ? null : Number(pInterval);
    }
    if (typeof qPhase !== 'undefined') {
      const p = String(qPhase).toLowerCase();
      req.query.phase = p === 'nomination' ? 'Nomination' : p === 'vote' ? 'Vote' : null;
    }
    if (typeof pPhase !== 'undefined') {
      const p = String(pPhase).toLowerCase();
      req.params.phase = p === 'nomination' ? 'Nomination' : p === 'vote' ? 'Vote' : null;
    }
    if (typeof type !== 'undefined') {
      const t = type.toLowerCase();
      req.params.type = ['nomination', 'allocation', 'payout'].includes(t) ? t : null;
    }

    next();
  },
/**
 * Make sure type is valid, otherwise throw an error
 */
validateType(req, res, next) {
    const { type } = req.params;
    if (!['nomination', 'payout', 'allocation'].includes(type.toLowerCase())) {
      next(
        new HttpError(
          httpStatus.BAD_REQUEST,
          'Type must be one of "nomination", "allocation" or "payout"'
        )
      );
    }
    else {
      next();
    }
  },
};
