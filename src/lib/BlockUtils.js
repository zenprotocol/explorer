export default {
  formatDifficulty(difficulty) {
    if(difficulty) {
      return `0x${Number(difficulty).toString(16)}`;
    }
    return '';
  }
};