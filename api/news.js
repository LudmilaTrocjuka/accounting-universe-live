const {collectNews}=require('../lib/news');
const snapshot=require('../data/news.json');
module.exports=async(req,res)=>{
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 try{
  const data=await collectNews({previous:snapshot});
  res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=300');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.status(200).json(data);
 }catch(error){console.error('news_collection_failed',error.name);res.setHeader('Cache-Control','no-store');return res.status(503).json({error:'Publisher updates temporarily unavailable'});}
};
