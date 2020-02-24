const httpStatus = require('http-status');
const HttpError = require('../../../lib/HttpError');

module.exports = {
  /**
   * Make sure params are correct
   */
  parseParams: function(req, res, next) {
    const { interval, phase } = req.query;
    const { type } = req.params;

    if (typeof interval !== 'undefined') {
      req.query.interval =
        isNaN(Number(interval)) || Number(interval) === 0 ? null : Number(interval);
    }
    if (typeof phase !== 'undefined') {
      const p = String(phase).toLowerCase();
      req.query.phase = p === 'nomination' ? 'Nomination' : p === 'vote' ? 'Vote' : null;
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
