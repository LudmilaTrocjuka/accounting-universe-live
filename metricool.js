// Metricool website analytics: run only after explicit cookie consent on every page.
(() => {
  'use strict';
  const key = 'cookie-consent';
  const trackerId = 'au-metricool-tracker';
  let started = false;

  function choice() {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  function track() {
    if (started || choice() !== 'accepted' || document.getElementById(trackerId)) return;
    started = true;
    const script = document.createElement('script');
    script.id = trackerId;
    script.async = true;
    script.src = 'https://tracker.metricool.com/resources/be.js';
    script.onload = () => {
      if (window.beTracker && typeof window.beTracker.t === 'function') {
        window.beTracker.t({ hash: '1d26d64fb34b8788a719a7b0068a6ae4' });
      }
    };
    script.onerror = () => { started = false; script.remove(); };
    document.head.appendChild(script);
  }

  function setChoice(value) {
    try { localStorage.setItem(key, value); } catch (_) { return; }
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.classList.add('hidden');
    if (value === 'accepted') track();
  }

  function setupBanner() {
    let banner = document.getElementById('cookie-banner');
    if (!banner) {
      // Internal pages previously offered no consent controls, so Metricool never ran.
      banner = document.createElement('div');
      banner.id = 'cookie-banner';
      banner.className = 'cookie-banner';
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-label', 'Cookie consent');
      banner.innerHTML = '<p>We use essential cookies to make this site work and optional analytics to improve it. <a href="/cookies.html">Learn more</a>.</p>' +
        '<div class="cta-group"><button type="button" id="accept-cookies" class="btn small">Accept all</button>' +
        '<button type="button" id="reject-cookies" class="btn small">Reject non-essential</button></div>';
      document.body.appendChild(banner);
    }
    if (choice() === 'accepted' || choice() === 'rejected') banner.classList.add('hidden');
    else banner.classList.remove('hidden');
    const accept = banner.querySelector('#accept-cookies');
    const reject = banner.querySelector('#reject-cookies');
    if (accept) accept.addEventListener('click', () => setChoice('accepted'));
    if (reject) reject.addEventListener('click', () => setChoice('rejected'));
    const review = document.getElementById('review-cookie-choice');
    if (review) review.addEventListener('click', () => {
      try { localStorage.removeItem(key); } catch (_) { return; }
      banner.classList.remove('hidden');
      if (accept) accept.focus();
    });
  }

  function init() { setupBanner(); track(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  window.addEventListener('storage', event => {
    if (event.key !== key) return;
    if (event.newValue === 'accepted') track();
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.classList.toggle('hidden', event.newValue === 'accepted' || event.newValue === 'rejected');
  });
})();
