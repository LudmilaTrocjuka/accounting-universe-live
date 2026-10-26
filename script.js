
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

// Unified general enquiry and free consultation request form.
const form = document.getElementById('contact-form');
const statusEl = document.getElementById('form-status');
const tsField = document.getElementById('ts');
const enquiryType = document.getElementById('enquiry-type');
const appointmentFields = document.getElementById('appointment-fields');
const preferredDate = document.getElementById('preferred-date');
const preferredTime = document.getElementById('preferred-time');
const submitBtn = form?.querySelector('button[type="submit"]');
let sending = false;
if (form && statusEl && tsField && enquiryType && appointmentFields && preferredDate && preferredTime && submitBtn) {
  const ukParts = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const valueFor = key => ukParts.find(p=>p.type===key)?.value;
  preferredDate.min = [valueFor('year'),valueFor('month'),valueFor('day')].join('-');
  tsField.value = String(Date.now());
  function updateEnquiryMode() {
    const isConsult = enquiryType.value === 'consultation';
    appointmentFields.classList.toggle('hidden',!isConsult);
    preferredDate.required = isConsult;
    preferredTime.required = isConsult;
    submitBtn.textContent = isConsult ? 'Request free consultation' : 'Send enquiry';
  }
  enquiryType.addEventListener('change',updateEnquiryMode);
  document.querySelectorAll('a[data-enquiry="consultation"]').forEach(link=>link.addEventListener('click',()=>{
    enquiryType.value='consultation';
    updateEnquiryMode();
  }));
  updateEnquiryMode();
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(sending || !form.reportValidity())return;
    const values=Object.fromEntries(new FormData(form).entries());
    const isConsult=values.enquiry_type==='consultation';
    if(isConsult){
      const date=new Date(values.preferred_date+'T12:00:00');
      if(!Number.isFinite(date.getTime()) || [0,6].includes(date.getDay()) || values.preferred_date<preferredDate.min){
        statusEl.classList.remove('hidden','success');
        statusEl.classList.add('error');
        statusEl.textContent='Please select a future weekday.';
        return;
      }
    }
    const message=(isConsult ? 'FREE INITIAL 30-MINUTE CONSULTATION REQUEST (NOT A CONFIRMED BOOKING)\nPreferred date: '+values.preferred_date+'\nPreferred start time: '+values.preferred_time+' UK time\n\n' : 'GENERAL ENQUIRY\n\n')+values.message;
    sending=true;
    submitBtn.disabled=true;
    submitBtn.textContent='Sending…';
    statusEl.classList.remove('hidden','error','success');
    statusEl.textContent='Sending…';
    try{
      const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:values.name,email:values.email,company:values.company,message,website:values.website,ts:values.ts})});
      const json=await response.json();
      if(!response.ok || !json.ok)throw new Error(json.error||'Send failed');
      statusEl.classList.add('success');
      statusEl.textContent=isConsult ? 'Request received. We will confirm the appointment by email; the time is not yet reserved.' : 'Thank you. Your enquiry has been sent.';
      form.reset();
      updateEnquiryMode();
    }catch(err){
      statusEl.classList.add('error');
      statusEl.textContent='Unable to send. Please try again or email us directly.';
    }finally{
      sending=false;
      submitBtn.disabled=false;
      submitBtn.textContent=enquiryType.value==='consultation' ? 'Request free consultation' : 'Send enquiry';
      tsField.value=String(Date.now());
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

// Package CTAs fill the contact enquiry without changing any client's existing message.
document.querySelectorAll('a[data-package]').forEach(link => {
  link.addEventListener('click', () => {
    if (!form) return;
    const tier = link.getAttribute('data-package');
    const message = form.querySelector('textarea[name="message"]');
    if (enquiryType) {
      enquiryType.value = 'general';
      enquiryType.dispatchEvent(new Event('change'));
    }
    if (message && !message.value.trim()) {
      message.value = 'I would like to discuss the ' + tier + ' package and request a tailored quotation for my business.';
    }
  });
});

// Keep the copyright year current.
const copyrightYear = document.getElementById('copyright-year');
if (copyrightYear) copyrightYear.textContent = String(new Date().getFullYear());



// Official publisher headlines; no generated tax advice is automatically published.
(() => {
  const grid=document.getElementById('insights-grid'),status=document.getElementById('insights-status'),lastChecked=document.getElementById('insights-last-checked');
  const buttons=[...document.querySelectorAll('[data-news-filter]')],more=document.getElementById('insights-more');
  if(!grid||!status||!buttons.length)return;
  let articles=[],filter='all',limit=6,busy=false;
  const labels={hospitality:'Hospitality',pubs:'Pubs & Bars',travel:'Travel',ecommerce:'E-commerce','uk-business':'UK Tax & Business'};
  const day=value=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/London'}).format(new Date(value));
  function show(){
    const matching=articles.filter(a=>filter==='all'||a.category===filter);
    // Show the latest item from every publisher before additional stories.
    const first=[],rest=[],seen=new Set();
    matching.forEach(a=>{if(filter==='all'&&!seen.has(a.source)){first.push(a);seen.add(a.source);}else rest.push(a);});
    const selected=(filter==='all'?[...first,...rest]:matching).slice(0,limit);
    grid.replaceChildren();
    status.textContent=selected.length?'Latest publisher updates · Publication and update dates are shown on each article.':'No matching articles available. Please see the original publishers below.';
    selected.forEach(item=>{
      let url;try{url=new URL(item.url);if(url.protocol!=='https:')return;}catch{return;}
      const card=document.createElement('article');card.className='insights-card';
      const meta=document.createElement('div');meta.className='insights-meta';
      meta.textContent=item.source+' · '+(item.dateKind==='updated'?'Updated ':'Published ')+day(item.date+'T12:00:00Z')+' · '+(labels[item.category]||'UK business');
      if(item.updatedAt&&item.updatedAt!==item.date)meta.textContent+=' · Updated '+day(item.updatedAt+'T12:00:00Z');
      const heading=document.createElement('h4');heading.textContent=item.title;
      const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Read original article ↗';
      card.append(meta,heading);
      if(item.live===false){const saved=document.createElement('p');saved.className='insights-status';saved.textContent='Saved article · Last retrieved '+(item.retrievedAt?day(item.retrievedAt):'date unavailable');card.append(saved);}
      card.append(link);grid.append(card);
    });
    if(more)more.hidden=matching.length<=limit;
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.newsFilter;limit=6;buttons.forEach(b=>{const yes=b===button;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));});show();}));
  if(more)more.addEventListener('click',()=>{limit+=6;show();});
  async function refresh(){
    if(busy)return;busy=true;
    try{
      const response=await fetch('/api/news',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(25000)});
      if(!response.ok)throw Error('news unavailable');
      const data=await response.json();articles=Array.isArray(data.articles)?data.articles:[];show();
      if(lastChecked){
        const checked=new Date(data.checkedAt),sources=Array.isArray(data.sourceStatus)?data.sourceStatus:[];
        const clock=Number.isFinite(checked.getTime())?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:'Europe/London'}).format(checked):'unavailable';
        const ok=sources.filter(s=>s.status==='ok').length;
        const missing=sources.filter(s=>s.status!=='ok').map(s=>s.name+' ('+(s.status==='cached'?'saved articles':'unavailable')+')');
        lastChecked.textContent='Publisher check: '+clock+' (UK time). Updated '+ok+'/'+sources.length+' sources. Scheduled collection every 6 hours; live results cached for up to 1 hour.'+(missing.length?' Needs attention: '+missing.join(', ')+'.':'');
      }
    }catch(_){status.textContent=articles.length?'Could not refresh publishers. Previously loaded articles remain below.':'News updates are temporarily unavailable. View the original sources below.';if(lastChecked)lastChecked.textContent='Latest publisher check could not be completed; no new verification time is claimed.';}
    finally{busy=false;}
  }
  refresh();
  setInterval(()=>{if(!document.hidden)refresh();},15*60*1000);
})();


// Activate our wide Chat button only when Chatling's documented SDK is available.
// If the widget cannot load, the existing Chatling launcher is left untouched.
(() => {
  const button = document.getElementById('au-chat-launcher');
  const widgetScript = document.getElementById('chtl-script');
  if (!button || !widgetScript) return;
  button.addEventListener('click', () => {
    if (window.Chatling && typeof window.Chatling.open === 'function') {
      window.Chatling.open();
    }
  });
  function activateLauncher() {
    const sdk = window.Chatling;
    if (!sdk || typeof sdk.open !== 'function') return;
    button.hidden = false;
  }
  widgetScript.addEventListener('load', activateLauncher, { once: true });
  activateLauncher(); // Also handles an async widget that loaded before this script.
})();

// Update Ludmila's completed UK accounting experience automatically each 1 November.
(() => {
  const el = document.getElementById('ludmila-uk-experience');
  if (!el) return;
  const today = new Date();
  // UK accounting career began 1 November 2009; on 1 November 2026 it reaches 17 years.
  const completedYears = today.getUTCFullYear() - 2009 - (today.getUTCMonth() < 10 ? 1 : 0);
  el.textContent = completedYears >= 17 ? `${completedYears} years` : 'nearly 17 years';
})();
