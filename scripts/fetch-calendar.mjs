import fs from 'node:fs/promises';
const feeds=['https://nfs.faireconomy.media/ff_calendar_thisweek.json','https://nfs.faireconomy.media/ff_calendar_nextweek.json'];
const relevant=/fed|fomc|interest rate|inflation|cpi|pce|payroll|employment|unemployment|jobless|gdp|pmi|ism|retail sales|consumer confidence|jolts|durable goods|powell|treasury/i;
const importance={Low:1,Medium:2,High:3};
const batches=await Promise.all(feeds.map(async url=>{const r=await fetch(url);if(!r.ok)throw new Error(`Calendar feed returned ${r.status}`);return r.json()}));
const fresh=batches.flat().filter(e=>e.country==='USD'&&relevant.test(e.title||'')).map(e=>({CalendarId:`ff-${e.date}-${e.title}`,Date:e.date,Country:'United States',Event:e.title,Category:e.title,Actual:e.actual||'',Forecast:e.forecast||'',Previous:e.previous||'',Importance:importance[e.impact]||1,Source:'Forex Factory public calendar'}));
let old=[];try{old=JSON.parse(await fs.readFile('data/calendar.json','utf8')).events||[]}catch{}
const now=new Date(),month=now.getUTCMonth(),year=now.getUTCFullYear();
const inMonth=e=>{const d=new Date(e.Date);return d.getUTCMonth()===month&&d.getUTCFullYear()===year};
const merged=new Map(old.filter(inMonth).map(e=>[e.CalendarId||`${e.Date}-${e.Event}`,e]));
for(const e of fresh.filter(inMonth))merged.set(e.CalendarId,e);
const events=[...merged.values()].sort((a,b)=>new Date(a.Date)-new Date(b.Date));
await fs.mkdir('data',{recursive:true});
await fs.writeFile('data/calendar.json',JSON.stringify({generatedAt:new Date().toISOString(),source:'Forex Factory public weekly export',events},null,2));
const key=process.env.TWELVE_DATA_API_KEY;if(!key)throw new Error('TWELVE_DATA_API_KEY GitHub secret is missing');
const priceResponse=await fetch(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent('XAU/USD')}&apikey=${encodeURIComponent(key)}`);const market=await priceResponse.json();
if(!priceResponse.ok||market.status==='error')throw new Error(market.message||`Twelve Data returned ${priceResponse.status}`);
await fs.writeFile('data/market.json',JSON.stringify({generatedAt:new Date().toISOString(),symbol:'XAU/USD',price:market.close,change:market.change,percentChange:market.percent_change,previousClose:market.previous_close},null,2));
console.log(`Saved ${events.length} events and XAU/USD market data`);
