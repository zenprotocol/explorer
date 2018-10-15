export default function() {
  return new Date(Date.now() - 86400000).toISOString().split('T')[0];
}