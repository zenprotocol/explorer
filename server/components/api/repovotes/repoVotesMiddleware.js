module.exports = {
  /**
   * Make sure phase is correct
   */
  parsePhaseParam: function(req, res, next) {
    const { phase } = req.query;

    if (phase) {
      req.query.phase =
        phase.toLowerCase() === 'candidate' ? 'Candidate' : 'Contestant';
    }

    next();
  }
};
