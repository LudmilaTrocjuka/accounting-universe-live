const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {SOURCES,parsePublisher,collectNews}=require('../lib/news');
const now=Date.parse('2026-10-26T19:00:00Z');
for(const [name,file] of [['ICAEW','icaew.html'],['BBPA','bbpa.html'],['ABTA','abta.xml']])test('Official '+name+' listing yields dated original links',()=>{
 const source=SOURCES.find(s=>s.name===name),body=fs.readFileSync(__dirname+'/fixtures/'+file,'utf8'),a=parsePublisher(body,source,now);
 assert(a.length>=2);assert(a.every(x=>x.date&&x.url.includes(source.host.replace(/^www\./,''))));
 if(name==='ICAEW')assert(a.some(x=>x.date==='2026-10-26'));
 if(name==='ABTA')assert(a.some(x=>x.title.includes('Maldives')&&x.date==='2026-10-21'));
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
