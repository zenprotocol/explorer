export default {
  clipboardApiSupported() {
    return (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      !navigator.userAgent.toLowerCase().includes('opr')
    );
  },
};
