export default function getPhaseName(phase) {
  return String(phase).toLowerCase() === 'nomination' ? 'Nomination' : 'Voting';
}
