function isHash(value) {
  return String(value).length === 64;
}

module.exports = isHash;