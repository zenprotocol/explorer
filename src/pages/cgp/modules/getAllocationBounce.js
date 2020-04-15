/**
 * Get the allocation bounce (min/max) in percentage
 */
export default function getAllocationBounce({ prevAllocation = 0 } = {}) {
  const prevCoinbaseRatio = 100 - Number(prevAllocation);
  const correctionCap = 100 - 15;
  const globalRatioMin = 100 - 90;

  const localRatioMin = (prevCoinbaseRatio * correctionCap) / 100;
  const localRatioMax = (prevCoinbaseRatio * 100) / correctionCap;
  const ratioMin = Math.max(globalRatioMin, localRatioMin);
  const ratioMax = Math.min(100, localRatioMax);

  const min = 100 - ratioMax;
  const max = 100 - ratioMin;
  return {
    min,
    max,
  };
}
