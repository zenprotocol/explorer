// if this will be used only in store, maybe use it directly there
export default {
  formatDifficulty(difficulty = '') {
    return difficulty && `0x${Number(difficulty).toString(16)}`;
  }
};