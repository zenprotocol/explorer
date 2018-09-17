class NetworkError extends Error {
  constructor(innerError, message, status) {
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
    this.status = status || 500;
  }
}

module.exports = NetworkError;