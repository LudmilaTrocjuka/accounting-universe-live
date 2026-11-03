const fs=require('node:fs'),path=require('node:path');
const {collectNews}=require('../lib/news');
(async()=>{
 const target=path.join(__dirname,'../data/news.json'),previous=JSON.parse(fs.readFileSync(target,'utf8'));
 const result=await collectNews({previous});
 fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');
 for(const s of result.sourceStatus)console.log(s.name,s.status,s.count);
 const unavailable=result.sourceStatus.filter(s=>s.status!=='ok');
 if(unavailable.length)console.warn('Partial publisher refresh:',unavailable.map(s=>s.name+' ('+s.status+')').join(', '));
 // A temporarily unavailable publisher must not fail the entire refresh when
 // other trusted publishers were updated and the previous snapshot is retained.
 if(result.liveSources.length===0){console.error('No publishers refreshed successfully');process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
