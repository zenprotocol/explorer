class DatabaseError extends Error {
  constructor(innerError, message) {
    if (!message && innerError && innerError.message) {
      message = innerError.message;
    }

    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }

    this.name = 'DatabaseError';
    this.inner = innerError;
  }
}

module.exports = DatabaseError;
