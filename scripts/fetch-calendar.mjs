import fs from "node:fs/promises";

const NEWS_API_KEY = process.env.MARKETAUX_API_KEY;

const relevant =
/fed|fomc|interest rate|inflation|cpi|pce|payroll|employment|unemployment|jobless|gdp|pmi|ism|retail sales|consumer confidence|jolts|durable goods|powell|treasury|gold|xau|usd|federal reserve/i;

if (!NEWS_API_KEY) {
  throw new Error("MARKETAUX_API_KEY GitHub secret is missing");
}

const url =
`https://api.marketaux.com/v1/news/all?api_token=${NEWS_API_KEY}&language=en&countries=us&limit=100`;

const response = await fetch(url);

if (!response.ok) {
  throw new Error(`MarketAux returned ${response.status}`);
}

const json = await response.json();

const events = (json.data || [])
  .filter(e => relevant.test(`${e.title} ${e.description || ""}`))
  .map(e => ({
    CalendarId: e.uuid,
    Date: e.published_at,
    Country: "United States",
    Event: e.title,
    Category: "Economic News",
    Actual: "",
    Forecast: "",
    Previous: "",
    Importance: 3,
    Source: "MarketAux",
    Url: e.url
  }))
  .sort((a, b) => new Date(a.Date) - new Date(b.Date));

await fs.mkdir("data", { recursive: true });

await fs.writeFile(
  "data/calendar.json",
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source: "MarketAux",
      events
    },
    null,
    2
  )
);

const key = process.env.TWELVE_DATA_API_KEY;

if (!key) {
  throw new Error("TWELVE_DATA_API_KEY GitHub secret is missing");
}

const priceResponse = await fetch(
  `https://api.twelvedata.com/quote?symbol=XAU/USD&apikey=${key}`
);

const market = await priceResponse.json();

if (!priceResponse.ok || market.status === "error") {
  throw new Error(market.message || "Twelve Data failed");
}

await fs.writeFile(
  "data/market.json",
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      symbol: "XAU/USD",
      price: market.close,
      change: market.change,
      percentChange: market.percent_change,
      previousClose: market.previous_close
    },
    null,
    2
  )
);

console.log(`Saved ${events.length} news events and XAU/USD market data`);
