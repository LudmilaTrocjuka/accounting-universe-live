
// Mobile nav
const toggle = document.querySelector('.nav-toggle');
const menu = document.querySelector('#menu');
if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    menu.classList.toggle('open');
  });
}

// Cookie banner
const banner = document.getElementById('cookie-banner');
const acceptBtn = document.getElementById('accept-cookies');
const rejectBtn = document.getElementById('reject-cookies');
const COOKIE_KEY = 'cookie-consent';
function hideBanner() { if (banner) banner.classList.add('hidden'); }
try {
  const saved = localStorage.getItem(COOKIE_KEY);
  if (saved) hideBanner();
  if (acceptBtn) acceptBtn.addEventListener('click', () => {
    localStorage.setItem(COOKIE_KEY, 'accepted'); hideBanner();
  });
  if (rejectBtn) rejectBtn.addEventListener('click', () => {
    localStorage.setItem(COOKIE_KEY, 'rejected'); hideBanner();
  });
} catch (e) {}

// Contact form → POST JSON to /api/contact
const form = document.getElementById('contact-form');
const statusEl = document.getElementById('form-status');
const tsField = document.getElementById('ts');
if (form && statusEl && tsField) {
  // Set timestamp when form loads (anti-bot)
  tsField.value = String(Date.now());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.classList.remove('success','error','hidden');
    statusEl.textContent = 'Sending...';

    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json && json.ok) {
        statusEl.textContent = 'Thanks! Your message has been sent.';
        statusEl.classList.add('success');
        form.reset();
        tsField.value = String(Date.now()); // reset timer for next submit
      } else {
        statusEl.textContent = json && json.error ? json.error : 'Failed to send. Please try again.';
        statusEl.classList.add('error');
      }
    } catch (err) {
      statusEl.textContent = 'Network error. Please try again.';
      statusEl.classList.add('error');
    }
  });
}
