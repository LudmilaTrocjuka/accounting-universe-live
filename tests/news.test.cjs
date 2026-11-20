const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {SOURCES,parsePublisher,collectNews}=require('../lib/news');
const now=Date.parse('2026-10-26T19:00:00Z');
test('Publisher extracts strip markup, omit repeated headlines and stay concise',()=>{
 const {shortSummary}=require('../lib/news');
 assert.equal(shortSummary('<p>New VAT rules</p>','New VAT rules'),'');
 assert.equal(shortSummary('ABTA update Full Page image author@example.com Thu, 11/19/2026 - 09:13 Article body starts here.','ABTA update'),'');
 assert.equal(shortSummary('<p>Businesses must keep digital VAT records. A second sentence explains the details.</p>'),'Businesses must keep digital VAT records.');
 assert(!shortSummary('<script>alert(1)</script><p>Businesses must keep digital VAT records.</p>').includes('alert'));
 assert(shortSummary('A useful account of the changes affecting businesses. '.repeat(20)).length<=300);
});
test('Missing extract uses original article metadata and survives publisher failure',async()=>{
 const {addArticleSummaries}=require('../lib/news');
 const article={source:'HMRC',category:'uk-business',title:'Tax update',url:'https://www.gov.uk/tax-update',updatedAt:'2026-11-20'};
 const summary='Businesses can check how the revised reporting requirements apply to their tax records.';
 await addArticleSummaries([article],{},async()=>({ok:true,url:article.url,text:async()=>'<meta name="description" content="'+summary+'">'}));
 assert.equal(article.summary,summary);
 const cached={...article,summary:''};
 await addArticleSummaries([cached],{articles:[article]},async()=>{throw Error('offline');});
 assert.equal(cached.summary,summary);
});
for(const [name,file] of [['ICAEW','icaew.html'],['BBPA','bbpa.html'],['ABTA','abta.xml']])test('Official '+name+' listing yields dated original links',()=>{
 const source=SOURCES.find(s=>s.name===name),body=fs.readFileSync(__dirname+'/fixtures/'+file,'utf8'),a=parsePublisher(body,source,now);
 assert(a.length>=2);assert(a.every(x=>x.date&&x.url.includes(source.host.replace(/^www\./,''))));
 if(name==='ICAEW')assert(a.some(x=>x.date==='2026-10-26'));
 if(name==='ABTA')assert(a.every(x=>!x.title.includes('Maldives')));
});
test('Atom rejects external links, invalid dates, future entries and duplicate URLs',()=>{
 const source=SOURCES[0],body='<feed>'+[
 ['Tax update','https://www.gov.uk/a','2026-10-25'],['Tax duplicate','https://www.gov.uk/a','2026-10-25'],['Tax bad','https://evil.example/a','2026-10-25'],['Tax future','https://www.gov.uk/b','2030-01-01'],['Tax invalid','https://www.gov.uk/c','invalid']
 ].map(([title,url,date])=>`<entry><title>${title}</title><link rel="alternate" href="${url}"/><published>${date}</published></entry>`).join('')+'</feed>';
 assert.equal(parsePublisher(body,source,now).length,1);
});
test('Source failure preserves actual retrieval date and is never called live',async()=>{
 const retrievedAt='2026-10-25T08:00:00Z',previous={articles:[{title:'Tax news',url:'https://www.gov.uk/a',date:'2026-10-25',updatedAt:'2026-10-25',retrievedAt,source:'HMRC'}],sourceStatus:[{name:'HMRC',lastSuccessAt:retrievedAt}]};
 const result=await collectNews({previous,now,fetcher:async()=>{throw Error('offline');}});
 assert.equal(result.articles[0].live,false);assert.equal(result.articles[0].retrievedAt,retrievedAt);assert.equal(result.sourceStatus[0].status,'cached');assert.equal(result.sourceStatus[0].lastSuccessAt,retrievedAt);assert.equal(result.sourceStatus[1].status,'unavailable');assert.equal(result.liveSources.length,0);
});


test('BBPA current article cards with dates are recognised',()=>{
 const source=SOURCES.find(s=>s.name==='BBPA');
 const body='<section class="latest-news"><div class="article-card">'+
 '<span class="article-date">2 Nov, 2026</span>'+
 '<h3><a href="https://www.beerandpub.com/news-insights-research/news/now-is-the-time-to-back-welsh-pubs/">'+
 'Now is the time to back Welsh pubs to kick start the Welsh economy</a></h3>'+
 '</div><div class="article-card"><span>28 Oct, 2026</span>'+
 '<h3><a href="https://www.beerandpub.com/news-insights-research/news/budget-2026-reaction/">'+
 'Budget 2026 Reaction for the pub sector</a></h3></div></section>';
 const a=parsePublisher(body,source,Date.parse('2026-11-03T12:00:00Z'));
 assert.equal(a.length,2);
 assert.equal(a[0].date,'2026-11-02');
 assert(a.every(x=>x.url.startsWith('https://www.beerandpub.com/')));
});

test('Evergreen HMRC account sign-in guidance is not listed as current news',()=>{
 const source=SOURCES.find(s=>s.name==='HMRC');
 const body='<feed><entry><title>Sign in to your HMRC business tax account</title>'+ 
 '<link rel="alternate" href="https://www.gov.uk/guidance/sign-in-to-your-hmrc-business-tax-account"/>'+ 
 '<updated>2026-11-03T12:00:00Z</updated></entry>'+ 
 '<entry><title>New VAT reporting requirements for business</title>'+ 
 '<link rel="alternate" href="https://www.gov.uk/guidance/new-vat-reporting-requirements"/>'+ 
 '<updated>2026-11-03T12:00:00Z</updated></entry></feed>';
 const items=parsePublisher(body,source,Date.parse('2026-11-03T14:00:00Z'));
 assert.equal(items.length,1);
 assert.equal(items[0].title,'New VAT reporting requirements for business');
});

test('ACCA listing recognises dated professional updates',()=>{
 const source=SOURCES.find(s=>s.name==='ACCA');
 assert(source,'ACCA must be monitored');
 const body='<article><time datetime="2026-11-08">8 Nov 2026</time><h2><a href="https://www.accaglobal.com/gb/en/news/2026/november/accounting-tax-update.html">Accounting tax update for practitioners</a></h2></article>';
 const items=parsePublisher(body,source,Date.parse('2026-11-09T12:00:00Z'));
 assert.equal(items.length,1);
 assert.equal(items[0].source,'ACCA');
});
test('Cached publisher news older than seven days is removed',async()=>{
 const previous={articles:[{title:'Tax news',url:'https://www.gov.uk/a',date:'2026-10-01',updatedAt:'2026-10-01',retrievedAt:'2026-10-01T00:00:00Z',source:'HMRC'}]};
 const result=await collectNews({previous,now:Date.parse('2026-11-09T12:00:00Z'),fetcher:async()=>{throw Error('offline');}});
 assert.equal(result.articles.length,0);
});

test('ACCA In Practice cards with ordinal dates yield original links',()=>{
 const source=SOURCES.find(s=>s.name==='ACCA');
 const body='<div class="content-card"><a href="/gb/en/technical-activities/uk-tech/in-practice-ezine-archive/In-Practice-archive-2026/October/Multi-factor-authentication-now-live-on-all-agent-accounts.html">Multi-factor authentication now live on all agent accounts</a><span>28th Oct 2026</span><p>HMRC updates tax agents on accounts</p></div>';
 const a=parsePublisher(body,source,Date.parse('2026-11-16T07:00:00Z'));
 assert.equal(a.length,1);assert.equal(a[0].date,'2026-10-28');
});
test('Seven official sources use HTTPS publisher links',()=>{
 assert.equal(SOURCES.length,7);
 for(const s of SOURCES)assert(s.site.startsWith('https://')&&s.url.startsWith('https://'));
});

