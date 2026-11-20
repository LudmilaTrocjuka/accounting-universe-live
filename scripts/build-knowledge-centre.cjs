const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/knowledge-centre.json'),'utf8'));
let home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/London'}).format(new Date(s));
const safeUrl=s=>{try{const u=new URL(s,'https://www.accounting-universe.co.uk');return u.protocol==='https:'?u.href:null;}catch{return null;}};
const entries=[...data.entries].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
if(new Set(entries.map(e=>e.id)).size!==entries.length)throw Error('Duplicate knowledge entry IDs');
for(const e of entries){if(!/^[a-z0-9-]+$/.test(e.id)||!e.title||!e.summary||!Number.isFinite(Date.parse(e.publishedAt)))throw Error('Invalid entry');for(const p of e.posts){if(p.status!=='sent'||!safeUrl(p.url))throw Error('Only verified sent social posts are allowed');}}
const latestPosts=e=>{const result=[];for(const service of ['linkedin','twitter']){const p=e.posts.filter(p=>p.service===service).sort((a,b)=>b.sentAt.localeCompare(a.sentAt))[0];if(p)result.push(p);}return result;};
const links=e=>latestPosts(e).map(p=>`<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${p.service==='linkedin'?'LinkedIn':'X'} original ↗</a>`).join(' · ');
const card=(e,level=4)=>`<article class="knowledge-card"><p class="knowledge-meta">${date(e.publishedAt)}</p><h${level}><a href="/knowledge-centre.html#${e.id}">${esc(e.title)}</a></h${level}><p>${esc(e.summary)}</p><a class="knowledge-read" href="/knowledge-centre.html#${e.id}">Read material →</a></article>`;
const section=`<section id="knowledge-centre" aria-labelledby="au-guides-title" class="knowledge-panel"><p class="knowledge-eyebrow">AU Finance &amp; Advisory · Knowledge Centre</p><h3 id="au-guides-title" data-heading-style="h4">Accounting guidance for UK businesses</h3><p>Our published insights on accounting, financial control and business decisions — collected from LinkedIn and X, with practical AU guides.</p><div class="knowledge-grid">${entries.slice(0,6).map(e=>card(e)).join('\n')}</div><p class="knowledge-actions"><a class="btn" href="/knowledge-centre.html">View all materials (${entries.length})</a></p><p>Need help applying these ideas? <a href="/#contact">Speak to AU Finance &amp; Advisory</a>.</p></section>`;
const old=/<section\b[^>]*aria-labelledby="au-guides-title"[\s\S]*?<\/section>/;
if(!old.test(home))throw Error('Knowledge Centre section not found');
home=home.replace(old,section).replace('aria-label="Archived reference material"','aria-label="AU Knowledge Centre"');
if(!home.includes('href="/knowledge-centre.css"'))home=home.replace('</head>','<link rel="stylesheet" href="/knowledge-centre.css">\n</head>');
fs.writeFileSync(path.join(root,'index.html'),home);
const absoluteAnchors=s=>s.replace(/href="#/g,'href="/#');
const header=absoluteAnchors(home.match(/<header\b[\s\S]*?<\/header>/)[0]);
const footer=absoluteAnchors(home.match(/<footer\b[\s\S]*?<\/footer>/)[0]);
function content(s){
 return String(s).replace(/\*\*/g,'').split(/\n\s*\n/).filter(Boolean).map(block=>'<p>'+esc(block).replace(/https:\/\/[^\s<>]+/g,url=>{const raw=url.replace(/[.,;)]$/,'');return `<a href="${raw}" target="_blank" rel="noopener noreferrer">${raw}</a>`+url.slice(raw.length);}).replace(/\n/g,'<br>')+'</p>').join('\n');
}
const articles=entries.map(e=>{
 const posts=latestPosts(e),primary=posts.find(p=>p.service==='linkedin')||posts[0];
 const media=primary?.assets.find(a=>a.type==='image'&&a.width>=600&&safeUrl(a.source));
 const body=primary?(primary.thread?.length>1?primary.thread.map(t=>t.text.replace(/^\d+\/\d+\s*\|?\s*/, '')).join('\n\n'):primary.text):'';
 const alternate=posts.filter(p=>p!==primary&&p.thread?.length>1).map(p=>`<details><summary>Read the complete X thread</summary>${content(p.thread.map(t=>t.text.replace(/^\d+\/\d+\s*\|?\s*/,'')).join('\n\n'))}</details>`).join('');
 return `<article id="${e.id}" class="knowledge-article"><p class="knowledge-meta">Originally published ${date(e.publishedAt)}</p><h2>${esc(e.title)}</h2><p class="knowledge-lead">${esc(e.summary)}</p>${media?`<img class="knowledge-image" src="${esc(media.source)}" alt="${esc(media.alt||e.title)}" width="${media.width}" height="${media.height}" loading="lazy">`:''}${body?`<details class="knowledge-body"><summary>Read the published material</summary>${content(body)}${alternate}</details>`:''}${e.guideUrl?`<p><a href="${esc(e.guideUrl)}">Read the full AU guide →</a></p>`:''}<p class="knowledge-source-links">${links(e)}</p><p><a href="#main">Back to all materials ↑</a></p></article>`;
}).join('\n');
const page=`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Knowledge Centre | AU Finance &amp; Advisory</title><meta name="description" content="Explore AU Finance & Advisory's published insights and practical guides on UK accounting, cash flow, financial control, hospitality and travel businesses."><link rel="canonical" href="https://www.accounting-universe.co.uk/knowledge-centre.html"><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/knowledge-centre.css"><meta property="og:type" content="website"><meta property="og:title" content="Knowledge Centre | AU Finance &amp; Advisory"><meta property="og:url" content="https://www.accounting-universe.co.uk/knowledge-centre.html"><meta property="og:image" content="https://www.accounting-universe.co.uk/images/au-social-logo-1200x630.png"><meta property="og:image:secure_url" content="https://www.accounting-universe.co.uk/images/au-social-logo-1200x630.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="AU Finance &amp; Advisory logo — white AU on dark green"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://www.accounting-universe.co.uk/images/au-social-logo-1200x630.png"><meta name="twitter:image:alt" content="AU Finance &amp; Advisory logo — white AU on dark green"><script defer src="/script.js"></script><script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments);};</script><script defer src="/_vercel/insights/script.js"></script><script defer src="/metricool.js?v=20261116"></script></head><body><a class="skip-link" href="#main">Skip to content</a>${header}<main id="main" class="section knowledge-page"><div class="container"><p class="knowledge-eyebrow">AU Finance &amp; Advisory</p><h1>Knowledge Centre</h1><p>Our published insights and practical guides for UK businesses. Browse a topic, read the material here, or visit the original LinkedIn or X publication.</p><nav aria-label="Knowledge Centre topics" class="knowledge-grid">${entries.map(e=>`<a class="knowledge-card" href="#${e.id}"><span class="knowledge-meta">${date(e.publishedAt)}</span><strong>${esc(e.title)}</strong></a>`).join('\n')}</nav>${articles}<p><a class="btn" href="/#contact">Discuss your business with us</a></p></div></main>${footer}</body></html>`;
fs.writeFileSync(path.join(root,'knowledge-centre.html'),page);
let sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
const url=`  <url><loc>https://www.accounting-universe.co.uk/knowledge-centre.html</loc><lastmod>${data.lastCheckedAt.slice(0,10)}</lastmod></url>`;
if(sitemap.includes('/knowledge-centre.html'))sitemap=sitemap.replace(/\s*<url><loc>https:\/\/www.accounting-universe.co.uk\/knowledge-centre.html<\/loc>[\s\S]*?<\/url>/,'\n'+url);
else sitemap=sitemap.replace('</urlset>',url+'\n</urlset>');
fs.writeFileSync(path.join(root,'sitemap.xml'),sitemap);
console.log(`Built ${entries.length} topics from ${data.processedPostIds.length} verified social records.`);
