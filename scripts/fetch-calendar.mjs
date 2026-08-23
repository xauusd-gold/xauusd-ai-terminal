import fs from "node:fs/promises";

const CALENDAR_URLS = ["https://nfs.faireconomy.media/ff_calendar_thisweek.json", "https://nfs.faireconomy.media/ff_calendar_nextweek.json"];
const GOLD_RELEVANT = /fed|fomc|interest rate|rate decision|inflation|cpi|pce|payroll|employment|unemployment|jobless|gdp|pmi|ism|retail sales|consumer confidence|jolts|durable goods|powell|treasury|consumer price|personal income|core pce/i;
const impactRank = { Low: 1, Medium: 2, High: 3 };

async function fetchCalendar(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Calendar feed returned ${response.status}`);
  const json = await response.json();
  if (!Array.isArray(json)) throw new Error("Calendar feed returned invalid JSON");
  return json;
}

const batches = await Promise.all(CALENDAR_URLS.map(fetchCalendar));
const events = batches.flat().filter(e => String(e.country || "").toUpperCase() === "USD").filter(e => GOLD_RELEVANT.test(String(e.title || ""))).map(e => ({
  CalendarId: `${e.country}-${e.date}-${e.title}`,
  Date: e.date,
  Country: e.country,
  Event: e.title,
  Category: "Economic Calendar",
  Actual: e.actual ?? "",
  Forecast: e.forecast ?? "",
  Previous: e.previous ?? "",
  Importance: impactRank[e.impact] || 1,
  Source: "Forex Factory / Fair Economy"
})).sort((a, b) => new Date(a.Date) - new Date(b.Date));

const uniqueEvents = [...new Map(events.map(e => [e.CalendarId, e])).values()];
await fs.mkdir("data", { recursive: true });
await fs.writeFile("data/calendar.json", JSON.stringify({ generatedAt: new Date().toISOString(), source: "Forex Factory / Fair Economy", events: uniqueEvents }, null, 2));

const key = process.env.TWELVE_DATA_API_KEY;
if (!key) throw new Error("TWELVE_DATA_API_KEY GitHub secret is missing");
const priceResponse = await fetch(`https://api.twelvedata.com/quote?symbol=XAU/USD&apikey=${key}`);
const market = await priceResponse.json();
if (!priceResponse.ok || market.status === "error") throw new Error(market.message || "Twelve Data failed");
await fs.writeFile("data/market.json", JSON.stringify({ generatedAt: new Date().toISOString(), symbol: "XAU/USD", price: market.close, change: market.change, percentChange: market.percent_change, previousClose: market.previous_close }, null, 2));
console.log(`Saved ${uniqueEvents.length} XAUUSD-relevant economic events and XAU/USD market data`);
