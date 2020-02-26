export default function getPhaseBlocks({ snapshot, tally, phase } = {}) {
  const half = snapshot + (tally - snapshot) / 2;
  return phase === 'Nomination'
    ? {
        snapshot,
        tally: half,
      }
    : {
        snapshot: half,
        tally,
      };
}
