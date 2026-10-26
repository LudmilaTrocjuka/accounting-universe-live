const fs=require('node:fs'),path=require('node:path');
const {collectNews}=require('../lib/news');
(async()=>{
 const target=path.join(__dirname,'../data/news.json'),previous=JSON.parse(fs.readFileSync(target,'utf8'));
 const result=await collectNews({previous});
 fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');
 for(const s of result.sourceStatus)console.log(s.name,s.status,s.count);
 if(result.sourceStatus.some(s=>s.status!=='ok'))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
