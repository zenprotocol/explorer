module.exports = {
  /**
   * Make sure phase is correct
   */
  parseQueryParams: function(req, res, next) {
    const { phase, interval } = req.query;

    if (phase) {
      req.query.phase =
        phase.toLowerCase() === 'candidate' ? 'Candidate' : 'Contestant';
    }

    req.query.interval = formatInterval(interval);

    next();
  }
};

function formatInterval(interval) {
  return isNaN(Number(interval)) || Number(interval) === 0 ? null : Number(interval);
}