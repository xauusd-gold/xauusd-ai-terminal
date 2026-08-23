import fs from "node:fs/promises";

const CALENDAR_URLS = [
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
  "https://nfs.faireconomy.media/ff_calendar_nextweek.json",
  "https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json",
  "https://cdn-nfs.faireconomy.media/ff_calendar_nextweek.json"
];
const GOLD_RELEVANT = /fed|fomc|interest rate|rate decision|inflation|cpi|pce|payroll|employment|unemployment|jobless|gdp|pmi|ism|retail sales|consumer confidence|jolts|durable goods|powell|treasury|consumer price|personal income|core pce/i;
const impactRank = { Low: 1, Medium: 2, High: 3 };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchCalendar(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "xauusd-ai-terminal/1.0" },
        signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (!Array.isArray(json)) throw new Error("invalid JSON array");
      return json;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(1000 * attempt);
    }
  }
  console.warn(`Calendar feed unavailable: ${url} (${lastError?.message || "unknown error"})`);
  return [];
}

const batches = await Promise.all(CALENDAR_URLS.map(fetchCalendar));
const rawEvents = batches.flat();
const events = rawEvents
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
await fs.mkdir("data", { recursive: true });

if (uniqueEvents.length > 0) {
  await fs.writeFile(
    "data/calendar.json",
    JSON.stringify({ generatedAt: new Date().toISOString(), source: "Forex Factory / Fair Economy", events: uniqueEvents }, null, 2)
  );
  console.log(`Saved ${uniqueEvents.length} XAUUSD-relevant economic events`);
} else {
  console.warn("No calendar feed returned usable events; preserving existing data/calendar.json");
}

async function readExistingMarket() {
  try { return JSON.parse(await fs.readFile("data/market.json", "utf8")); }
  catch { return {}; }
}

const existingMarket = await readExistingMarket();
const key = process.env.TWELVE_DATA_API_KEY;
let market = null;

if (key) {
  try {
    const response = await fetch(`https://api.twelvedata.com/quote?symbol=XAU/USD&apikey=${key}`, {
      signal: AbortSignal.timeout(15000)
    });
    const json = await response.json();
    if (response.ok && json.status !== "error" && json.close) market = json;
    else console.warn(`Twelve Data unavailable: ${json.message || `HTTP ${response.status}`}`);
  } catch (error) {
    console.warn(`Twelve Data request failed: ${error.message}`);
  }
}

if (!market) {
  try {
    const response = await fetch("https://api.gold-api.com/price/XAU", {
      headers: { "user-agent": "xauusd-ai-terminal/1.0" },
      signal: AbortSignal.timeout(15000)
    });
    const json = await response.json();
    if (!response.ok || !Number.isFinite(Number(json.price))) throw new Error(json.message || `HTTP ${response.status}`);
    market = {
      close: String(json.price),
      change: "",
      percent_change: "",
      previous_close: existingMarket.previousClose || ""
    };
    console.log("Using Gold API fallback for XAU/USD price");
  } catch (error) {
    console.warn(`Gold API fallback failed: ${error.message}`);
  }
}

if (market?.close) {
  await fs.writeFile("data/market.json", JSON.stringify({
    generatedAt: new Date().toISOString(),
    symbol: "XAU/USD",
    price: market.close,
    change: market.change ?? "",
    percentChange: market.percent_change ?? "",
    previousClose: market.previous_close ?? existingMarket.previousClose ?? ""
  }, null, 2));
  console.log(`Saved XAU/USD price ${market.close}`);
} else {
  console.warn("No live XAU/USD provider available; preserving existing data/market.json");
}
