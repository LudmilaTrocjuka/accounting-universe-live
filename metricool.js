// Load optional Metricool website statistics after analytics consent.
(() => {
  let started = false;
  function startMetricool() {
    if (started) return;
    try {
      if (localStorage.getItem('cookie-consent') !== 'accepted') return;
    } catch (_) { return; }
    started = true;
    const script = document.createElement('script');
    script.id = 'au-metricool-tracker';
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://tracker.metricool.com/resources/be.js';
    script.onload = () => {
      if (typeof window.beTracker === 'function') {
        window.beTracker.t({ hash: '1d26d64fb34b8788a719a7b0068a6ae4' });
      }
    };
    document.head.appendChild(script);
  }
  startMetricool();
  // script.js saves the choice before this listener runs.
  const accept = document.getElementById('accept-cookies');
  if (accept) accept.addEventListener('click', startMetricool);
  window.addEventListener('storage', event => {
    if (event.key === 'cookie-consent' && event.newValue === 'accepted') startMetricool();
  });
})();
