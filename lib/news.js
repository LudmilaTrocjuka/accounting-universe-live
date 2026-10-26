const {load}=require('cheerio');
const SOURCES=[
 {name:'HMRC',category:'uk-business',host:'www.gov.uk',kind:'xml',site:'https://www.gov.uk/government/organisations/hm-revenue-customs',url:'https://www.gov.uk/government/organisations/hm-revenue-customs.atom'},
 {name:'Companies House',category:'uk-business',host:'www.gov.uk',kind:'xml',site:'https://www.gov.uk/government/organisations/companies-house',url:'https://www.gov.uk/government/organisations/companies-house.atom'},
 {name:'ICAEW',category:'uk-business',host:'www.icaew.com',kind:'icaew',site:'https://www.icaew.com/insights/tax-news',url:'https://www.icaew.com/insights/tax-news'},
 {name:'UKHospitality',category:'hospitality',host:'www.ukhospitality.org.uk',kind:'xml',site:'https://www.ukhospitality.org.uk/news/',url:'https://www.ukhospitality.org.uk/feed/'},
 {name:'BBPA',category:'pubs',host:'www.beerandpub.com',kind:'bbpa',site:'https://www.beerandpub.com/news-research/',url:'https://www.beerandpub.com/news-research/'},
 {name:'ABTA',category:'travel',host:'www.abta.com',kind:'xml',site:'https://www.abta.com/news',url:'https://www.abta.com/rss'}
];
const KEYWORDS=/tax|vat|rates|hmrc|mtd|payroll|pay[e]?|national insurance|wage|employment|staff|tips|tipping|duty|duties|regulat|commission|financ|account|bookkeeping|report|tour operator|margin scheme|company|companies|cost|customs|business|budget|digital|marketplace|pension|travel|tourism|holiday|hospitality|pubs|beer|reform/i;
const text=v=>String(v||'').replace(/\s+/g,' ').trim();
function trusted(value,s){try{const u=new URL(value,s.site);return u.protocol==='https:'&&u.hostname.replace(/^www\./,'')===s.host.replace(/^www\./,'')?u.href:null;}catch{return null;}}
function category(v,f){
 if(/\bpubs?\b|beer duty|draught relief/i.test(v))return 'pubs';
 if(/hospitality|restaurants?|\bbars\b|hotels?|service charges|tipping/i.test(v))return 'hospitality';
 if(/tourism|tour operator|holiday habits|maldives|outbound travel/i.test(v))return 'travel';
 if(/e-commerce|ecommerce|marketplace|online sellers|retail|online shops/i.test(v))return 'ecommerce';
 return f;
}
function parsePublisher(body,s,now=Date.now()){
 const $=load(body,{xmlMode:s.kind==='xml'}),raw=[];
 if(s.kind==='xml')$('entry,item').each((_,el)=>{
  const e=$(el);raw.push({title:e.find('title').first().text(),url:e.find('link[rel="alternate"]').first().attr('href')||e.find('link[href]').first().attr('href')||e.find('link').first().text(),dateKind:e.find('published,pubDate').length?'published':'updated',date:e.find('published').first().text()||e.find('pubDate').first().text()||e.find('updated').first().text()||e.find('dc\\:date').first().text(),updated:e.find('updated').first().text(),summary:e.find('summary,description').first().text()});
 });
 else if(s.kind==='icaew')$('.c-content-meta').each((_,el)=>{const e=$(el),a=e.find('.c-content-meta__heading a').first();raw.push({title:a.text(),url:a.attr('href'),date:e.find('.date').first().text(),summary:e.find('.c-content-meta__content').text()});});
 else if(s.kind==='bbpa')$('li.wp-block-post').each((_,el)=>{const e=$(el),a=e.find('.wp-block-post-title a').first();raw.push({title:a.text(),url:a.attr('href'),date:e.find('time').first().attr('datetime'),summary:e.find('.wp-block-post-excerpt').text()});});
 const seen=new Set(),out=[];
 for(const r of raw.slice(0,100)){
  const title=text(r.title),url=r.url&&trusted(r.url,s),stamp=Date.parse(r.date),updated=Date.parse(r.updated);
  if(!title||!url||!Number.isFinite(stamp)||stamp>now+86400000||seen.has(url)||!KEYWORDS.test(title+' '+r.summary))continue;
  const date=new Date(stamp).toISOString().slice(0,10),updatedAt=Number.isFinite(updated)&&updated<=now+86400000?new Date(updated).toISOString().slice(0,10):date;
  seen.add(url);out.push({title:title.slice(0,220),url,date,dateKind:r.dateKind||'published',updatedAt,source:s.name,category:category(title+' '+text(r.summary),s.category),live:true});
 }
 return out.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)||b.date.localeCompare(a.date)).slice(0,8);
}
async function readPublisher(s,fetcher,now){
 const r=await fetcher(s.url,{headers:{Accept:s.kind==='xml'?'application/atom+xml, application/rss+xml, application/xml':'text/html','User-Agent':'AccountingUniverseNews/2.0 (+https://www.accounting-universe.co.uk)'},signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('HTTP '+r.status);
 if(r.url&&!trusted(r.url,s))throw Error('Unexpected redirect');
 const body=await r.text();if(body.length>3000000)throw Error('Response too large');
 const articles=parsePublisher(body,s,now);if(!articles.length)throw Error('No dated relevant articles found');return articles;
}
async function collectNews({previous={},fetcher=fetch,now=Date.now()}={}){
 const checkedAt=new Date(now).toISOString(),results=await Promise.allSettled(SOURCES.map(s=>readPublisher(s,fetcher,now))),articles=[],sourceStatus=[];
 SOURCES.forEach((s,i)=>{
  const r=results[i];
  if(r.status==='fulfilled'){
   articles.push(...r.value.map(a=>({...a,retrievedAt:checkedAt})));
   sourceStatus.push({name:s.name,status:'ok',checkedAt,lastSuccessAt:checkedAt,count:r.value.length});
  }else{
   const saved=(previous.articles||[]).filter(a=>a.source===s.name&&trusted(a.url,s)&&a.retrievedAt).map(a=>({...a,live:false}));articles.push(...saved);
   const lastSuccessAt=(previous.sourceStatus||[]).find(x=>x.name===s.name)?.lastSuccessAt||saved[0]?.retrievedAt||null;
   sourceStatus.push({name:s.name,status:saved.length?'cached':'unavailable',checkedAt,lastSuccessAt,count:saved.length});
   console.warn('publisher_update_failed',s.name,r.reason.message);
  }
 });
 const unique=[...new Map(articles.map(a=>[a.url,a])).values()].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)||b.date.localeCompare(a.date));
 return {version:2,articles:unique,checkedAt,sources:SOURCES.map(({name,site})=>({name,url:site})),sourceStatus,liveSources:sourceStatus.filter(s=>s.status==='ok').map(s=>s.name),note:'Official publisher headlines and links. Hourly request cache; scheduled collection every six hours. Saved articles retain their actual retrieval date.'};
}
module.exports={SOURCES,parsePublisher,collectNews};
