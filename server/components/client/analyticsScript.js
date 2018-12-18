const tags = require('common-tags');
module.exports = ({ googleTrackingId } = {}) => {
  if(googleTrackingId) {
    return tags.oneLine`
    <script>
      window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
      ga('create', '${googleTrackingId}', 'auto');
    </script>
    <script async src='https://www.google-analytics.com/analytics.js'></script>
    `;
  }
  
  return tags.oneLine`
    <script>
      window.ga=function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
    </script>
    `;
};
