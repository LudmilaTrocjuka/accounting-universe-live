
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
const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
let sending = false;
if (form && statusEl && tsField) {
  // Set timestamp when form loads (anti-bot)
  tsField.value = String(Date.now());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
   if (sending) return;
  sending = true;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
  }

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
      } else {
        statusEl.textContent = json && json.error ? json.error : 'Failed to send. Please try again.';
        statusEl.classList.add('error');
      }
    } catch (err) {
      statusEl.textContent = 'Network error. Please try again.';
      statusEl.classList.add('error');
    } finally {
    sending = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send';
    }
    tsField.value = String(Date.now()); // reset timer for next submit
    }
  });
  }

// Interactive package finder: gives a non-binding starting-point recommendation.
const finder = document.getElementById('package-finder');
if (finder) {
  const industry = document.getElementById('finder-industry');
  const transactions = document.getElementById('finder-transactions');
  const needs = document.getElementById('finder-needs');
  const check = document.getElementById('finder-check');
  const validation = document.getElementById('finder-validation');
  const result = document.getElementById('finder-result');
  const tierLabel = document.getElementById('finder-tier');
  const reasonLabel = document.getElementById('finder-reason');
  const enquire = document.getElementById('finder-enquire');
  let currentTier = null;
  const options = {
    starter: { title: 'Starter — from £125/month + VAT', reason: 'For straightforward records and up to 50 transactions per month. We will confirm your software, account count and any extra services when we quote.' },
    standard: { title: 'Standard — from £245/month + VAT', reason: 'For growing businesses, 51–200 monthly transactions, or businesses requiring regular VAT and management reporting subject to agreed scope.' },
    premium: { title: 'Premium — from £445/month + VAT', reason: 'For more than 200 transactions or specialist, multi-currency or management-accounting requirements. The volume, services and final monthly fee are agreed individually.' }
  };
  check.addEventListener('click', () => {
    const missing = [industry, transactions, needs].find(field => !field.value);
    if (missing) {
      validation.classList.remove('hidden');
      result.classList.add('hidden');
      missing.focus();
      return;
    }
    validation.classList.add('hidden');
    let choice = transactions.value === 'large' ? 'premium' : transactions.value === 'medium' ? 'standard' : 'starter';
    if (needs.value === 'complex') choice = 'premium';
    else if (needs.value === 'vat' && choice === 'starter') choice = 'standard';
    if (industry.value === 'travel' && choice === 'starter') choice = 'standard';
    currentTier = choice;
    tierLabel.textContent = options[choice].title;
    reasonLabel.textContent = options[choice].reason;
    document.querySelectorAll('.price-card').forEach(card => card.classList.toggle('recommended', card.id === 'tier-' + choice));
    result.classList.remove('hidden');
    result.scrollIntoView({behavior:'smooth', block:'nearest'});
  });
  enquire.addEventListener('click', () => {
    if (!currentTier || !form) return;
    const msg = form.querySelector('textarea[name="message"]');
    if (msg && !msg.value.trim()) {
      const businessType = industry.options[industry.selectedIndex].text;
      const volume = transactions.options[transactions.selectedIndex].text;
      const support = needs.options[needs.selectedIndex].text;
      msg.value = 'I would like to discuss the ' + currentTier[0].toUpperCase() + currentTier.slice(1) + ' package. Business: ' + businessType + '. Monthly transactions: ' + volume + '. Required support: ' + support + '. Please contact me to agree an appropriate service and quotation.';
    }
  });
}

// Keep the copyright year current.
const copyrightYear = document.getElementById('copyright-year');
if (copyrightYear) copyrightYear.textContent = String(new Date().getFullYear());

// Free consultation: date-and-time REQUEST, not a confirmed booking.
// Uses the same website email endpoint as the contact form.
const consultationForm = document.getElementById('consultation-form');
if (consultationForm) {
  const consultationStatus = document.getElementById('consultation-status');
  const consultationDate = consultationForm.querySelector('input[name="preferred_date"]');
  const consultationTs = consultationForm.querySelector('input[name="ts"]');
  const consultationSubmit = consultationForm.querySelector('button[type="submit"]');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateAsLocalISO = d => {
    const y = d.getFullYear();
    return y + '-' + String(d.getMonth() + 1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  };
  consultationDate.min = dateAsLocalISO(tomorrow);
  consultationTs.value = String(Date.now());
  let busy = false;
  consultationForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || !consultationForm.reportValidity()) return;
    const fields = Object.fromEntries(new FormData(consultationForm).entries());
    const selectedDate = new Date(fields.preferred_date + 'T12:00:00');
    if (Number.isNaN(selectedDate.getTime()) || selectedDate.getDay() === 0 || selectedDate.getDay() === 6 || fields.preferred_date < consultationDate.min) {
      consultationStatus.textContent = 'Please choose a future weekday (Monday–Friday).';
      consultationStatus.classList.remove('hidden');
      consultationStatus.classList.add('error');
      return;
    }
    busy = true;
    consultationSubmit.disabled = true;
    consultationSubmit.textContent = 'Sending request…';
    consultationStatus.textContent = 'Sending your request…';
    consultationStatus.classList.remove('hidden','error');
    const message = 'Free 30-minute consultation request (NOT YET CONFIRMED)\n'
      + 'Preferred date: ' + fields.preferred_date + '\n'
      + 'Preferred time: ' + fields.preferred_time + ' UK local time\n'
      + 'Topic: ' + (fields.topic || 'Initial accounting consultation');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fields.name, email: fields.email, company: fields.company, message, website: fields.website, ts: fields.ts })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Could not send the request');
      consultationStatus.textContent = 'Your request has been sent. We will reply by email to confirm the appointment. No time has been reserved yet.';
      consultationForm.reset();
      consultationTs.value = String(Date.now());
    } catch (error) {
      consultationStatus.textContent = (error && error.message) || 'Unable to send. Please try again or email us directly.';
      consultationStatus.classList.add('error');
    } finally {
      busy = false;
      consultationSubmit.disabled = false;
      consultationSubmit.textContent = 'Request free consultation';
    }
  });
}
