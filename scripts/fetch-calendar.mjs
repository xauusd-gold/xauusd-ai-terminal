import fs from "node:fs/promises";

const CALENDAR_URLS = [
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
  "https://nfs.faireconomy.media/ff_calendar_nextweek.json"
];
const GOLD_RELEVANT = /fed|fomc|interest rate|rate decision|inflation|cpi|pce|payroll|employment|unemployment|jobless|gdp|pmi|ism|retail sales|consumer confidence|jolts|durable goods|powell|treasury|consumer price|personal income|core pce/i;
const impactRank = { Low: 1, Medium: 2, High: 3 };

async function fetchCalendar(url) {
  const response = await fetch(url, { headers: { "user-agent": "xauusd-ai-terminal/1.0" } });
  if (!response.ok) throw new Error(`Calendar feed returned ${response.status}`);
  const json = await response.json();
  if (!Array.isArray(json)) throw new Error("Calendar feed returned invalid JSON");
  return json;
}

const batches = await Promise.all(CALENDAR_URLS.map(fetchCalendar));
const events = batches
  .flat()
  .filter(e => String(e.country || "").toUpperCase() === "USD")
  .filter(e => GOLD_RELEVANT.test(String(e.title || "")))
  .map(e => ({
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
  }))
  .sort((a, b) => new Date(a.Date) - new Date(b.Date));

const uniqueEvents = [...new Map(events.map(e => [e.CalendarId, e])).values()];
if (!uniqueEvents.length) throw new Error("Calendar feed returned zero USD gold-relevant events; keeping previous data");

await fs.mkdir("data", { recursive: true });
await fs.writeFile(
  "data/calendar.json",
  JSON.stringify({ generatedAt: new Date().toISOString(), source: "Forex Factory / Fair Economy", events: uniqueEvents }, null, 2)
);

async function fetchGoldApi() {
  const response = await fetch("https://api.gold-api.com/price/XAU", { headers: { "user-agent": "xauusd-ai-terminal/1.0" } });
  if (!response.ok) throw new Error(`Gold API returned ${response.status}`);
  const data = await response.json();
  if (!Number.isFinite(Number(data.price))) throw new Error("Gold API returned invalid price");
  return {
    generatedAt: new Date().toISOString(),
    symbol: "XAU/USD",
    price: String(data.price),
    change: "",
    percentChange: "",
    previousClose: "",
    source: "Gold API"
  };
}

async function fetchTwelveData(key) {
  const response = await fetch(`https://api.twelvedata.com/quote?symbol=XAU/USD&apikey=${key}`);
  const data = await response.json();
  if (!response.ok || data.status === "error" || !Number.isFinite(Number(data.close))) {
    throw new Error(data.message || "Twelve Data failed");
  }
  return {
    generatedAt: new Date().toISOString(),
    symbol: "XAU/USD",
    price: String(data.close),
    change: String(data.change ?? ""),
    percentChange: String(data.percent_change ?? ""),
    previousClose: String(data.previous_close ?? ""),
    source: "Twelve Data"
  };
}

try {
  const market = process.env.TWELVE_DATA_API_KEY
    ? await fetchTwelveData(process.env.TWELVE_DATA_API_KEY)
    : await fetchGoldApi();
  await fs.writeFile("data/market.json", JSON.stringify(market, null, 2));
  console.log(`Saved ${uniqueEvents.length} calendar events and XAU/USD market data from ${market.source}`);
} catch (error) {
  console.warn(`Market price refresh failed: ${error.message}`);
  try {
    const market = await fetchGoldApi();
    await fs.writeFile("data/market.json", JSON.stringify(market, null, 2));
    console.log("Saved XAU/USD market data from Gold API fallback");
  } catch (fallbackError) {
    console.warn(`Gold API fallback failed: ${fallbackError.message}`);
    console.warn("Calendar data was updated; existing market.json was preserved.");
  }
}
