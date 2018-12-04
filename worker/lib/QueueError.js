class QueueError extends Error {
  constructor(innerError) {
    super(innerError.message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, innerError);
    }

    this.name = 'QueueError';
  }
}

module.exports = QueueError;
