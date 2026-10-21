// Curated UK accounting news with live publisher-feed updates where offered.
// No third-party API keys, article copying, or client-side cross-origin fetching.
const SOURCES = [
  {
    name: 'HMRC', category: 'uk-business', host: 'www.gov.uk',
    site: 'https://www.gov.uk/search/news-and-communications?organisations%5B%5D=hm-revenue-customs',
    feeds: ['https://www.gov.uk/search/news-and-communications.atom?organisations%5B%5D=hm-revenue-customs'],
    fallback: {title: 'Sole traders and landlords earning more than £30,000 urged to act now',
      date: '2026-10-05', url: 'https://www.gov.uk/government/news/sole-traders-and-landlords-earning-more-than-30000-urged-to-act-now', category: 'uk-business'}
  },
  {
    name: 'ICAEW', category: 'uk-business', host: 'www.icaew.com',
    site: 'https://www.icaew.com/insights/tax-news',
    feeds: [],
    fallback: {title: 'Preparing for 2027/28: changes to the calculation of income tax',
      date: '2026-10-09', url: 'https://www.icaew.com/insights/tax-news/2026/oct-2026/preparing-for-2027-28-changes-to-the-calculation-of-income-tax', category: 'uk-business'}
  },
  {
    name: 'UKHospitality', category: 'hospitality', host: 'www.ukhospitality.org.uk',
    site: 'https://www.ukhospitality.org.uk/news/',
    feeds: ['https://www.ukhospitality.org.uk/feed/'],
    fallback: {title: 'Hospitality has the highest tax burden in the economy, new data reveals',
      date: '2026-10-01', url: 'https://www.ukhospitality.org.uk/hospitality-highest-tax-burden/', category: 'hospitality'}
  },
  {
    name: 'BBPA', category: 'pubs', host: 'www.beerandpub.com',
    site: 'https://www.beerandpub.com/news-research/news/',
    feeds: ['https://www.beerandpub.com/feed/'],
    fallback: {title: 'Britain set to lose one pub a day in 2026 as sector calls for business rates reform',
      date: '2026-10-12', url: 'https://www.beerandpub.com/news-insights-research/news/britain-set-to-lose-one-pub-a-day-in-2026-at-the-expense-of-over-5000-jobs-as-government-urged-to-deliver-on-promises-for-sector/', category: 'pubs'}
  },
  {
    name: 'ABTA', category: 'travel', host: 'www.abta.com',
    site: 'https://www.abta.com/news',
    feeds: ['https://www.abta.com/news/rss.xml'],
    fallback: {title: 'New Maldives tax rules to affect UK travel businesses',
      date: '2026-09-17', url: 'https://www.abta.com/news', category: 'travel'}
  }
];

const KEYWORDS = /vat|tax|rates|hmrc|mtd|payroll|pay[e]?|national insurance|wage|employment|staff cost|tips|tipping|duty|duties|regulat|commission|financial|accounting|bookkeeping|reporting|tour operator|margin scheme|company|cost pressure|customs|business|budget|digital record|marketplace|pension/i;
function decode(value) {
  return String(value || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));
}
function tag(item, name) {
  const hit = item.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+name+'>', 'i'));
  return hit ? decode(hit[1]).trim() : '';
}
function trusted(url, host) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && (u.hostname === host || u.hostname === host.replace(/^www\./,''));
  } catch (_) { return false; }
}
function categorise(text, defaultCategory) {
  if (/\bpub\b|\bpubs\b|beer duty|draught relief/i.test(text)) return 'pubs';
  if (/hospitality|restaurants?|\bbars\b|hotels?|service charges|tipping/i.test(text)) return 'hospitality';
  if (/travel|tourism|tour operator|holiday|toms|maldives/i.test(text)) return 'travel';
  if (/e-commerce|ecommerce|marketplace|online sellers|retail|online shops/i.test(text)) return 'ecommerce';
  return defaultCategory;
}
function extractItems(xml, source) {
  const nodes = xml.match(/<entry\b[^>]*>[\s\S]*?<\/entry>|<item\b[^>]*>[\s\S]*?<\/item>/gi) || [];
  const items = [];
  for (const node of nodes.slice(0, 25)) {
    const title = tag(node, 'title');
    const summary = tag(node, 'summary') || tag(node, 'description');
    const atomLink = node.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\/?\s*>/i);
    const link = atomLink ? decode(atomLink[1]) : tag(node, 'link');
    const rawDate = tag(node, 'published') || tag(node, 'updated') || tag(node, 'pubDate') || tag(node, 'dc:date');
    const timestamp = Date.parse(rawDate);
    const date = Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 10) : '';
    if (!title || !date || !trusted(link, source.host) || !KEYWORDS.test(title+' '+summary)) continue;
    if (timestamp > Date.now() + 24 * 3600 * 1000) continue;
    items.push({ title: title.slice(0, 170), url: link, date, source: source.name,
      category: categorise(title+' '+summary, source.category), live: true });
  }
  return items;
}
async function readPublisher(source) {
  for (const feed of source.feeds) {
    try {
      const response = await fetch(feed, {headers:{'Accept':'application/atom+xml, application/rss+xml, application/xml, text/xml'},signal:AbortSignal.timeout(3500)});
      if (!response.ok) continue;
      const xml = await response.text();
      if (!/<(?:feed|rss)\b/i.test(xml.slice(0, 1500))) continue;
      const items = extractItems(xml, source);
      if (items.length) return items.slice(0, 5);
    } catch (_) { /* Publisher unavailable; show an explicitly dated original source. */ }
  }
  return [];
}
module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({error:'Method not allowed'});
  const fetched = await Promise.all(SOURCES.map(readPublisher));
  const articles = [];
  SOURCES.forEach((source, index) => {
    const live = fetched[index];
    if (live.length) articles.push(...live);
    else articles.push({...source.fallback, source:source.name, live:false});
  });
  const unique = [...new Map(articles.map(article => [article.url, article])).values()];
  unique.sort((a,b) => b.date.localeCompare(a.date));
  res.setHeader('Cache-Control','public, s-maxage=21600, stale-while-revalidate=3600');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.status(200).json({
    articles:unique.slice(0, 20),
    checkedAt:new Date().toISOString(), // Time these publisher feeds were actually checked server-side; response may be CDN cached.
    sources:SOURCES.map(({name,site})=>({name,url:site})),
    liveSources:SOURCES.filter((_,i)=>fetched[i].length).map(s=>s.name),
    note:'Publisher feeds are refreshed where available; dated source selections are shown when live feeds are unavailable.'
  });
};
