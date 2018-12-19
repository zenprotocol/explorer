export default {
  formatDifficulty(difficulty) {
    if (difficulty) {
      return conversions.decimal(difficulty);
    }
    return '';
  },
};

const conversions = {
  decimal(difficulty) {
    return difficulty;
  },
  hexadecimal(difficulty) {
    return `0x${Number(difficulty).toString(16)}`;
  },
};
