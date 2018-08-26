class NetworkError extends Error {
  constructor(innerError, message) {
    if (!message && innerError && innerError.message) {
      message = innerError.message;
    }

    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }

    this.name = 'NetworkError';
    this.inner = innerError;
  }
}

module.exports = NetworkError;