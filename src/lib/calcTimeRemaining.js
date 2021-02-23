/**
 * Calc the remaining time string for the provided blocks count
 * @param {number} blocksCount
 * @returns {string} the remaining time string
 */
export default function calcTimeRemaining(blocksCount) {
  const time = blocksCount * 4;
  const days = Math.floor(time / (24 * 60));
  const hours = Math.floor((time - days * 24 * 60) / 60);
  const minutes = Math.floor(time - days * 24 * 60 - hours * 60);
  const dayAdded = days === 0 ? '' : `${days}d`;
  const hourAdded = hours === 0 ? '' : `${hours}h`;
  const minuteAdded = minutes === 0 ? '' : `${minutes}m`;
  const daysSeparator = days && (hours || minutes) ? ' : ' : '';
  const hoursSeparator = hours && minutes ? ' : ' : '';
  return `${dayAdded}${daysSeparator}${hourAdded}${hoursSeparator}${minuteAdded}`;
}
