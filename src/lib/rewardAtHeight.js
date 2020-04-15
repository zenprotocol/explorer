const HALVING = 800000;

/**
 * Calculates the ZP reward at a given height
 *
 * @param {number} height
 * @returns the ZP reward at the given height
 */
export default function rewardAtHeight(height) {
  const periodAtHeight = Math.ceil((height - 1) / HALVING);
  return 50 * Math.pow(2, -1 * (periodAtHeight - 1));
}
