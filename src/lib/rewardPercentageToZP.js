import rewardAtHeight from './rewardAtHeight';

export default function rewardPercentageToZP({ percentage, height } = {}) {
  return (rewardAtHeight(height) * percentage) / 100;
}
